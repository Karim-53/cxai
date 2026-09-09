import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import initSqlJs from "sql.js";
import pf from "pareto-frontier";
import Plot from "react-plotly.js";
import CheckboxTree from "react-checkbox-tree";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import "./styles.css";

import DB from "./database";
// Required to let webpack 4 know it needs to copy the wasm file to our assets
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

import {
  CATEGORIES,
  CATEGORY_DEFINITION,
  COLUMN_LABEL,
  NODES,
  TOTALS_SQL,
  detailsSql,
  keptTestsSql,
  overviewSql,
  queryOne,
  testsSql,
  toRows,
} from "./queries";
import {
  average,
  formatAuthors,
  formatDate,
  formatScore,
  formatSeconds,
  isMissing,
  parseBibtex,
  renderText,
} from "./format";
import { PALETTE, PLOT_CONFIG, axisStyle, baseLayout, useMediaQuery, useTheme } from "./theme";
import {
  IconAlert,
  IconChart,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClose,
  IconCopy,
  IconDownload,
  IconExternal,
  IconFilter,
  IconGithub,
  IconList,
  IconMenu,
  IconMoon,
  IconPaper,
  IconPointer,
  IconSquare,
  IconSquareChecked,
  IconSquareHalf,
  IconSun,
} from "./icons";

const ARXIV = "https://arxiv.org/pdf/2207.14160.pdf";
const REPO = "https://github.com/Karim-53/Compare-xAI";
const DATA = "https://github.com/Karim-53/Compare-xAI/tree/main/data";
const TEST_CSV = "https://github.com/Karim-53/Compare-xAI/blob/main/data/01_raw/test.csv";

const SECTIONS = [
  { id: "Filters", num: "1", label: "Filters", icon: IconFilter },
  { id: "Overview_Plot", num: "2", label: "Overview", icon: IconChart },
  { id: "Explainer_details", num: "3", label: "Details", icon: IconList },
  { id: "Explainer_limits", num: "4", label: "Limits", icon: IconAlert },
];

const EXTERNAL_LINKS = [
  { href: ARXIV, label: "ArXiv paper", icon: IconPaper },
  { href: DATA, label: "Download data", icon: IconDownload },
  { href: `${REPO}#readme`, label: "GitHub", icon: IconGithub },
];

const ALL_PARENTS = (function collect(nodes, accumulator = []) {
  nodes.forEach((node) => {
    if (node.children) {
      accumulator.push(node.value);
      collect(node.children, accumulator);
    }
  });
  return accumulator;
})(NODES);

const DEFAULT_CHECKED = ["output_importance"];
const DEFAULT_EXPLAINER = "kernel_shap";

const TREE_ICONS = {
  check: <IconSquareChecked className="rct-icon rct-icon-check" />,
  uncheck: <IconSquare className="rct-icon rct-icon-uncheck" />,
  halfCheck: <IconSquareHalf className="rct-icon rct-icon-half-check" />,
  expandClose: <IconChevronRight className="rct-icon rct-icon-expand-close" />,
  expandOpen: <IconChevronDown className="rct-icon rct-icon-expand-open" />,
  expandAll: <span />,
  collapseAll: <span />,
  parentClose: null,
  parentOpen: null,
  leaf: null,
};

const OVERVIEW_COLUMNS = [
  { key: "explainer", label: COLUMN_LABEL.explainer, primary: true },
  { key: "average_score", label: COLUMN_LABEL.average_score, type: "score" },
  { key: "time_per_test", label: COLUMN_LABEL.time_per_test, type: "seconds" },
  { key: "eligible_points", label: COLUMN_LABEL.eligible_points, type: "number" },
].concat(
  CATEGORIES.map((category) => ({
    key: `percentage_${category}`,
    label: COLUMN_LABEL[`percentage_${category}`],
    type: "score",
    secondary: true, // folded away on phones, where every cell becomes a row
  }))
);

const TEST_COLUMNS = [
  { key: "Test", label: "Test", primary: true },
  { key: "Score [%]", label: "Score [%]", type: "score" },
  { key: "Category", label: "Category" },
  { key: "Tested xAI output", label: "Tested xAI output" },
];

function scrollToId(id) {
  const element = document.getElementById(id);
  if (!element) return;
  const reduceMotion =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (element.scrollIntoView) {
    try {
      element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      return;
    } catch (error) {
      /* older browsers: no options object */
    }
    element.scrollIntoView();
  }
}

/* ========================================================================== */
/* Root                                                                        */
/* ========================================================================== */

export default function App() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const SQL = await initSqlJs({ locateFile: () => sqlWasm });
        const response = await fetch(DB);
        if (!response.ok) throw new Error(`Could not download the benchmark database (HTTP ${response.status}).`);
        const buffer = await response.arrayBuffer();
        if (cancelled) return;
        setDb(new SQL.Database(new Uint8Array(buffer)));
      } catch (loadError) {
        if (!cancelled) setError(loadError);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="boot">
        <IconAlert style={{ width: 28, height: 28, color: "var(--critical)" }} />
        <div>
          <p>
            <strong>The benchmark database could not be loaded.</strong>
          </p>
          <p className="muted">{String(error.message || error)}</p>
        </div>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="boot">
        <div className="spinner" />
        <p>Crunching the latest data, just for you. Hang tight…</p>
      </div>
    );
  }

  return <Benchmark db={db} />;
}

/* ========================================================================== */
/* Page                                                                        */
/* ========================================================================== */

function Benchmark({ db }) {
  const [theme, toggleTheme] = useTheme();
  const compact = !useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [checked, setChecked] = useState(DEFAULT_CHECKED);
  const [expanded, setExpanded] = useState(ALL_PARENTS);
  const [selectedExplainer, setSelectedExplainer] = useState(DEFAULT_EXPLAINER);
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const menuButton = useRef(null);

  /* ---- data ------------------------------------------------------------- */
  const overview = useMemo(() => {
    try {
      const rows = toRows(queryOne(db, overviewSql(checked))).map((row) => ({
        ...row,
        average_score: average(CATEGORIES.map((category) => row[`percentage_${category}`])),
      }));
      const kept = queryOne(db, keptTestsSql(checked));
      const totals = queryOne(db, TOTALS_SQL);
      return {
        rows,
        keptTests: kept.values.length ? kept.values[0][0] : 0,
        totalTests: totals.values.length ? totals.values[0][0] : 0,
        totalExplainers: totals.values.length ? totals.values[0][1] : 0,
        lastUpdated: totals.values.length ? totals.values[0][2] : null,
        error: null,
      };
    } catch (queryError) {
      return { rows: [], keptTests: 0, totalTests: 0, totalExplainers: 0, lastUpdated: null, error: queryError };
    }
  }, [db, checked]);

  const explainerData = useMemo(() => {
    try {
      return {
        details: queryOne(db, detailsSql(selectedExplainer)),
        tests: queryOne(db, testsSql(selectedExplainer, checked)),
        error: null,
      };
    } catch (queryError) {
      return { details: { columns: [], values: [] }, tests: { columns: [], values: [] }, error: queryError };
    }
  }, [db, selectedExplainer, checked]);

  const selectedRow = overview.rows.find((row) => row.explainer === selectedExplainer) || null;
  const queryError = overview.error || explainerData.error;

  /* ---- navigation ------------------------------------------------------- */
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!navOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape" || event.key === "Esc") {
        setNavOpen(false);
        if (menuButton.current) menuButton.current.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [navOpen]);

  /* The page content only exists once the database is parsed, so the browser
     cannot honour a #hash on load by itself. */
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) window.setTimeout(() => scrollToId(hash), 60);
  }, []);

  const goToSection = useCallback((id) => {
    setNavOpen(false);
    scrollToId(id);
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  const selectExplainer = useCallback(
    (name) => {
      if (!name) return;
      setSelectedExplainer(name);
      goToSection("Explainer_details");
    },
    [goToSection]
  );

  /* ---- derived numbers -------------------------------------------------- */
  const keptExplainers = overview.rows.length;
  const tooManyFilters = keptExplainers <= 1;
  const categoryScores = selectedRow
    ? CATEGORIES.map((category) => selectedRow[`percentage_${category}`])
    : CATEGORIES.map(() => null);

  return (
    <div className="app">
      <a className="skip-link" href="#Filters" onClick={(event) => { event.preventDefault(); goToSection("Filters"); }}>
        Skip to the benchmark
      </a>

      <header className="topbar">
        <button
          type="button"
          className="icon-btn"
          ref={menuButton}
          aria-label="Open navigation"
          aria-expanded={navOpen}
          aria-controls="sidenav"
          onClick={() => setNavOpen(true)}
        >
          <IconMenu />
        </button>
        <a className="topbar__brand" href="#header" onClick={(event) => { event.preventDefault(); goToSection("header"); }}>
          <span className="topbar__dot" />
          Compare-xAI
        </a>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <div className="layout">
        {navOpen && !isDesktop && (
          <button type="button" className="nav-backdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
        )}

        <SideNav
          open={navOpen}
          active={activeSection}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={goToSection}
          onClose={() => setNavOpen(false)}
          isDesktop={isDesktop}
          lastUpdated={overview.lastUpdated}
        />

        <main className="main" id="main">
          <Hero onNavigate={goToSection} />

          {queryError && (
            <div className="notice notice--error" role="alert">
              <IconAlert />
              <span>
                <strong>The query failed.</strong> {String(queryError.message || queryError)}
              </span>
            </div>
          )}

          {/* ---------------- 1. Filters ---------------- */}
          <section className="section" id="Filters" aria-labelledby="Filters-title">
            <div className="section__head">
              <span className="section__num">1</span>
              <h2 className="section__title" id="Filters-title">
                Shortlist xAI that fits your needs
              </h2>
            </div>
            <p className="section__lead">
              Use the filters below to describe the xAI model and the dataset you would like to explain.
            </p>

            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="filters__toolbar">
                <button type="button" className="btn btn--sm" onClick={() => setExpanded(ALL_PARENTS)}>
                  Expand all
                </button>
                <button type="button" className="btn btn--sm" onClick={() => setExpanded([])}>
                  Collapse all
                </button>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => setChecked([])}
                  disabled={checked.length === 0}
                >
                  Clear filters
                </button>
              </div>
              <CheckboxTree
                nodes={NODES}
                checked={checked}
                expanded={expanded}
                onCheck={setChecked}
                onExpand={setExpanded}
                icons={TREE_ICONS}
                showExpandAll={false}
              />
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat__value">
                  {keptExplainers} <small>/ {overview.totalExplainers}</small>
                </div>
                <div className="stat__label">xAI tools kept</div>
              </div>
              <div className="stat">
                <div className="stat__value">
                  {overview.keptTests} <small>/ {overview.totalTests}</small>
                </div>
                <div className="stat__label">tests kept</div>
              </div>
              <div className="stat">
                <div className="stat__value">{CATEGORIES.length}</div>
                <div className="stat__label">scoring categories</div>
              </div>
            </div>

            {tooManyFilters && (
              <div className="notice notice--warn" role="status">
                <IconAlert />
                <span>None of the indexed xAI satisfy the selected constrains. Please use less filters.</span>
              </div>
            )}

            <p className="prose" style={{ marginTop: "1rem" }}>
              Below, we test every xAI on these <strong>{overview.keptTests}</strong> test(s). Every test evaluates a
              specific aspect of the xAI algorithm (the <strong>fidelity</strong> of the explanation to the AI behavior,
              the <strong>stability</strong> of the xAI against minor changes in the AI, etc.){" "}
              <a href={ARXIV} target="_blank" rel="noopener noreferrer">
                Learn more about implemented tests and how the selection was done.
              </a>
            </p>
          </section>

          {/* ---------------- 2. Overview ---------------- */}
          <section className="section" id="Overview_Plot" aria-labelledby="Overview_Plot-title">
            <div className="section__head">
              <span className="section__num">2</span>
              <h2 className="section__title" id="Overview_Plot-title">
                Evaluate selected xAI using an intuitive scoring method
              </h2>
            </div>
            <p className="section__lead">
              The bubble plot summarizes the average performance of the selected xAI(s): time on the x-axis versus score
              in percentage on the y-axis.
            </p>

            <figure className="figure">
              <div className="plot-frame">
                <OverviewPlot
                  rows={overview.rows}
                  theme={theme}
                  compact={compact}
                  selected={selectedExplainer}
                  onSelect={selectExplainer}
                />
              </div>
              <figcaption className="figcaption">
                <b>Figure 1:</b> Global overview of the explainers&apos; performance.{" "}
                <span className="plot-hint">
                  <IconPointer /> Tip: click an explainer for more details.
                </span>
              </figcaption>
            </figure>

            <p className="prose" style={{ marginTop: "1.25rem" }}>
              A perfect xAI should obtain a score of 100% and finish all {overview.keptTests} tests in the smallest
              amount of time. Therefore, it would be located on the top left. Moreover, some xAI might break while
              running, because of algorithmic/implementation issues. The dot size represents the number of tests
              completed without failure. Thus, higher portability is described with a bigger dot.{" "}
              <a href={ARXIV} target="_blank" rel="noopener noreferrer">
                Learn more about the overview plot.
              </a>
            </p>

            <p className="prose" style={{ marginTop: "1rem" }}>
              An xAI can obtain a good average score but it might completely fail in a specific category of tests.{" "}
              <strong>Table 1</strong> contains a more detailed scoring method by subdividing the score into{" "}
              {CATEGORIES.length} categories:
            </p>

            <ul className="catlist">
              {CATEGORIES.map((category) => (
                <li className="catlist__item" key={category}>
                  <span className="dot" style={{ background: "var(--accent)" }} />
                  <span>
                    <span className="catlist__name">{category === "stress" ? "Stress tests" : category}</span>{" "}
                    — {CATEGORY_DEFINITION[category]}
                  </span>
                </li>
              ))}
            </ul>

            <p className="prose" style={{ marginTop: "1rem" }}>
              <a href={ARXIV} target="_blank" rel="noopener noreferrer">
                See our paper for more details.
              </a>
            </p>

            <figure className="figure">
              <figcaption className="figcaption" style={{ marginBottom: ".6rem", marginTop: 0 }}>
                <b>Table 1:</b> Subscores given the selected filters. Select a row to inspect that explainer.
              </figcaption>
              <ResultsTable
                columns={OVERVIEW_COLUMNS}
                rows={overview.rows}
                rowKey="explainer"
                selected={selectedExplainer}
                onSelect={selectExplainer}
                defaultSort={{ key: "average_score", direction: "desc" }}
                emptyMessage="No xAI algorithm matches the selected filters."
                caption="Table 1: subscores of every selected explainer"
              />
            </figure>

            <p className="prose" style={{ marginTop: "1rem" }}>
              Subscores change with the selected list of tests. Unselect all filters to have a global evaluation of the
              xAI or select the appropriate ones to obtain an evaluation of the use case of your need.
            </p>
          </section>

          {/* ---------------- 3. Details ---------------- */}
          <section className="section" id="Explainer_details" aria-labelledby="Explainer_details-title">
            <div className="section__head">
              <span className="section__num">3</span>
              <h2 className="section__title" id="Explainer_details-title">
                Explainer details
              </h2>
            </div>
            <p className="section__lead">
              Select one specific explainer by clicking a dot in Figure 1 or a row in Table 1. Below you can find a
              helpful description of the explainer and its specific requirements.
            </p>

            <div className="selected-bar">
              <span className="selected-bar__label">Selected explainer</span>
              <span className="selected-bar__name">{selectedExplainer}</span>
              {selectedRow && (
                <span className="muted nowrap">
                  average score {formatScore(selectedRow.average_score) || "—"}% ·{" "}
                  {formatSeconds(selectedRow.time_per_test) || "—"} s per test
                </span>
              )}
            </div>

            <div className="card" style={{ marginTop: "1rem" }}>
              <ExplainerDetails result={explainerData.details} explainer={selectedExplainer} />
            </div>

            {!selectedRow && (
              <div className="notice notice--warn" role="status">
                <IconAlert />
                <span>
                  With the applied filters, none of remaining tests could be applied on this explainer, please select
                  another one by clicking a dot in Figure 1.
                </span>
              </div>
            )}

            <figure className="figure">
              <div className="plot-frame">
                <CategoryPlot scores={categoryScores} theme={theme} compact={compact} />
              </div>
              <figcaption className="figcaption">
                <b>Figure 2:</b> Score of <b>{selectedExplainer}</b> per category.
              </figcaption>
            </figure>
          </section>

          {/* ---------------- 4. Limits ---------------- */}
          <section className="section" id="Explainer_limits" aria-labelledby="Explainer_limits-title">
            <div className="section__head">
              <span className="section__num">4</span>
              <h2 className="section__title" id="Explainer_limits-title">
                Limits of the interpretability of its output
              </h2>
            </div>
            <p className="section__lead">
              <strong>Table 2</strong> gives the most detailed scoring. Here you will learn when exactly{" "}
              {selectedExplainer} fails in explaining a model. The table is sorted by score (increasing) so you just
              need to look at the few first tests with a score below 80%. Want to learn how to deal with the limitations
              of the {selectedExplainer} explainer?{" "}
              <a href={TEST_CSV} target="_blank" rel="noopener noreferrer">
                See the workaround solution for each test here!
              </a>
            </p>

            <figure className="figure">
              <figcaption className="figcaption" style={{ marginBottom: ".6rem", marginTop: 0 }}>
                <b>Table 2:</b> Score obtained by <b>{selectedExplainer}</b> for each test.
              </figcaption>
              <ResultsTable
                columns={TEST_COLUMNS}
                rows={toRows(explainerData.tests)}
                rowKey="Test"
                defaultSort={{ key: "Score [%]", direction: "asc" }}
                emptyMessage={`No test result available for ${selectedExplainer} with the current filters.`}
                caption={`Table 2: score of ${selectedExplainer} on every kept test`}
              />
            </figure>

            <p className="prose" style={{ marginTop: "1rem" }}>
              Table 2 is limited to the selected list of tests after filtering. Unselect all filters to have a global
              evaluation of the xAI or select the appropriate ones to obtain an evaluation of the use case of your need.
            </p>
          </section>

          <footer className="footer">
            <nav aria-label="External resources">
              {EXTERNAL_LINKS.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </nav>
            {overview.lastUpdated && <span>Benchmark data last updated {formatDate(overview.lastUpdated)}</span>}
            <img
              src="https://4805.short.gy/count-visit"
              title="Number of page visit since start"
              alt=""
              width="80"
              height="20"
              loading="lazy"
              style={{ marginLeft: "auto" }}
            />
          </footer>
        </main>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Chrome                                                                      */
/* ========================================================================== */

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}

function SideNav({ open, active, theme, onToggleTheme, onNavigate, onClose, isDesktop, lastUpdated }) {
  return (
    <nav
      id="sidenav"
      className={`sidenav${open ? " is-open" : ""}`}
      aria-label="Sections"
      aria-hidden={!open && !isDesktop}
    >
      <button type="button" className="icon-btn sidenav__close" aria-label="Close navigation" onClick={onClose}>
        <IconClose />
      </button>

      <a
        className="topbar__brand"
        href="#header"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("header");
        }}
        style={{ padding: ".25rem .6rem" }}
      >
        <span className="topbar__dot" />
        Compare-xAI
      </a>

      <p className="sidenav__title">Benchmark</p>
      <ul className="sidenav__list">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <li key={section.id}>
              <a
                className="sidenav__link"
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(section.id);
                }}
              >
                <span className="sidenav__num">{section.num}</span>
                <span>{section.label}</span>
                <Icon style={{ marginLeft: "auto" }} />
              </a>
            </li>
          );
        })}
      </ul>

      <p className="sidenav__title">Resources</p>
      <ul className="sidenav__list">
        {EXTERNAL_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <a className="sidenav__link" href={link.href} target="_blank" rel="noopener noreferrer">
                <Icon />
                <span>{link.label}</span>
                <IconExternal style={{ marginLeft: "auto", opacity: 0.5 }} />
              </a>
            </li>
          );
        })}
      </ul>

      <div className="sidenav__foot">
        <button type="button" className="btn btn--sm" onClick={onToggleTheme}>
          {theme === "dark" ? <IconSun /> : <IconMoon />}
          {theme === "dark" ? "Light theme" : "Dark theme"}
        </button>
        {lastUpdated && <p style={{ marginTop: ".75rem" }}>Data updated {formatDate(lastUpdated)}</p>}
      </div>
    </nav>
  );
}

function Hero({ onNavigate }) {
  const steps = [
    { id: "Filters", text: "Shortlist xAI that fits your needs" },
    { id: "Overview_Plot", text: "Evaluate them using an intuitive scoring method" },
    { id: "Explainer_details", text: "Select one xAI and learn more about its specific requirements" },
    { id: "Explainer_limits", text: "Learn the limits of the interpretability of its output" },
  ];

  return (
    <section className="hero" id="header" aria-labelledby="hero-title">
      <span className="hero__eyebrow">A benchmark for feature importance explainable AI</span>
      <h1 className="hero__title" id="hero-title">
        Compare-xAI
      </h1>
      <p className="hero__subtitle">
        Are you wondering what is the difference between public explainable AI (xAI) tools? Compare-xAI evaluates them
        with functional unit tests, right in your browser.
      </p>

      <div className="hero__actions">
        <a className="btn btn--primary" href={ARXIV} target="_blank" rel="noopener noreferrer">
          <IconPaper /> Read the paper
        </a>
        <a className="btn" href={`${REPO}#readme`} target="_blank" rel="noopener noreferrer">
          <IconGithub /> GitHub
        </a>
        <a className="btn" href={DATA} target="_blank" rel="noopener noreferrer">
          <IconDownload /> Download data
        </a>
      </div>

      <ol className="steps">
        {steps.map((step) => (
          <li key={step.id}>
            <a
              href={`#${step.id}`}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(step.id);
              }}
            >
              {step.text}
            </a>
          </li>
        ))}
      </ol>

      <p className="figcaption" style={{ marginTop: "1.25rem" }}>
        Don&apos;t forget to{" "}
        <a href={ARXIV} target="_blank" rel="noopener noreferrer">
          cite our paper
        </a>{" "}
        :)
      </p>
    </section>
  );
}

/* ========================================================================== */
/* Plots                                                                       */
/* ========================================================================== */

function OverviewPlot({ rows, theme, compact, selected, onSelect }) {
  const colors = PALETTE[theme];
  const height = compact ? 400 : 560;

  const points = rows.filter(
    (row) => Number.isFinite(Number(row.time_per_test)) && Number(row.time_per_test) > 0 && row.average_score !== null
  );

  const times = points.map((row) => Number(row.time_per_test));
  const scores = points.map((row) => Number(row.average_score));
  const names = points.map((row) => row.explainer);
  const completed = points.map((row) => Number(row.eligible_points) || 0);

  const maxCompleted = Math.max(1, ...completed);
  /* Area - not diameter - carries "number of completed tests". */
  const sizes = completed.map((value) => 8 + 26 * Math.sqrt(value / maxCompleted));

  const frontier = points.length
    ? pf.getParetoFrontier(points.map((row, i) => [scores[i], times[i]]), { optimize: "bottomRight" })
    : [];

  const markerLineColor = names.map((name) => (name === selected ? colors.text1 : colors.surface));
  const markerLineWidth = names.map((name) => (name === selected ? 2.5 : 1.5));

  /* Fixed axis ranges used to hide any explainer outside [20, 100]% or outside
     the hard-coded time window; the ranges now follow the data. */
  const xRange = times.length
    ? [Math.log10(Math.min(...times)) - 0.5, Math.log10(Math.max(...times)) + 0.5]
    : [-2.8, 3.5];
  const yRange = scores.length ? [Math.max(0, Math.min(...scores) - 8), 102] : [20, 100];

  const data = [
    {
      x: frontier.map((point) => point[1]),
      y: frontier.map((point) => point[0]),
      mode: "lines",
      type: "scatter",
      name: "Pareto front",
      line: { color: colors.series2, width: 2 },
      hoverinfo: "skip",
    },
    {
      x: times,
      y: scores,
      text: names,
      customdata: completed,
      mode: compact ? "markers" : "markers+text",
      type: "scatter",
      name: "Explainers",
      textposition: names.map((_, index) => (index % 2 === 0 ? "top center" : "bottom center")),
      textfont: { color: colors.text3, size: 11 },
      cliponaxis: false,
      marker: {
        size: sizes,
        color: colors.series1,
        opacity: 0.9,
        line: { color: markerLineColor, width: markerLineWidth },
      },
      hovertemplate:
        "<b>%{text}</b><br>Average score: %{y:.1f}%<br>Time per test: %{x:.3g} s<br>Completed tests: %{customdata}<extra></extra>",
    },
  ];

  const layout = {
    ...baseLayout(theme, compact),
    height,
    margin: compact ? { l: 48, r: 14, t: 40, b: 48 } : { l: 78, r: 18, t: 44, b: 62 },
    xaxis: {
      ...axisStyle(theme),
      type: "log",
      range: xRange,
      dtick: 1, // one label per decade instead of unreadable minor log ticks
      title: {
        text: compact
          ? "Time per test [s] — log scale"
          : "Fast alg. ←     Average time per test [Seconds] ↓     → Slow alg.",
        font: { color: colors.text2 },
      },
    },
    yaxis: {
      ...axisStyle(theme),
      range: yRange,
      ticksuffix: "%",
      title: {
        text: compact
          ? "Comprehensibility score"
          : "Comprehensibility score<br>Poor ←   Average performance per test [%] ↑  → Excellent",
        font: { color: colors.text2 },
      },
    },
    legend: compact
      ? { orientation: "h", x: 0, y: 1.14, xanchor: "left", yanchor: "top", font: { color: colors.text2 } }
      : { x: 1, y: 0, xanchor: "right", yanchor: "bottom", tracegroupgap: 20, font: { color: colors.text2 },
          bgcolor: "rgba(0,0,0,0)" },
    annotations: compact
      ? []
      : [
          {
            x: 0.02,
            y: 100,
            xref: "paper",
            yref: "y",
            text: "Best xAI(s) are close to this point.",
            showarrow: true,
            arrowhead: 7,
            ax: 40,
            ay: -30,
            font: { color: colors.text3 },
            arrowcolor: colors.text3,
          },
        ],
  };

  const handleClick = useCallback(
    (event) => {
      const point = event && event.points && event.points[0];
      if (point && typeof point.text === "string") onSelect(point.text);
    },
    [onSelect]
  );

  const setCursor = useCallback((event, cursor) => {
    /* Scope the lookup to this plot: a global getElementsByClassName picked the
       other figure's drag layer (and threw when it did not exist yet). */
    const root = event && event.event && event.event.target && event.event.target.closest
      ? event.event.target.closest(".js-plotly-plot")
      : null;
    const drag = root && root.getElementsByClassName("nsewdrag")[0];
    if (drag) drag.style.cursor = cursor;
  }, []);

  if (!points.length) {
    return <div className="table-empty" style={{ height }}>No explainer left to plot. Remove a filter to see results.</div>;
  }

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ ...PLOT_CONFIG, displayModeBar: !compact }}
      onClick={handleClick}
      onHover={(event) => setCursor(event, "pointer")}
      onUnhover={(event) => setCursor(event, "")}
      divId="fig"
      useResizeHandler
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}

function CategoryPlot({ scores, theme, compact }) {
  const colors = PALETTE[theme];
  const height = compact ? 280 : 340;
  const labels = CATEGORIES.slice().reverse();
  const values = scores.slice().reverse();

  const data = [
    {
      type: "bar",
      orientation: "h",
      x: values,
      y: labels,
      text: values.map((value) => (isMissing(value) ? "" : `${Number(value).toFixed(1)}%`)),
      textposition: "auto",
      insidetextfont: { color: "#fff" },
      outsidetextfont: { color: colors.text2 },
      cliponaxis: false,
      hovertext: labels.map((label) => CATEGORY_DEFINITION[label]),
      hovertemplate:
        "<b>Sub-category</b>: %{y}<br><b>Sub-score</b>: %{x:.1f}%<br><b>Definition</b>: %{hovertext}<extra></extra>",
      marker: { color: colors.series1, line: { color: colors.surface, width: 2 } },
    },
  ];

  const layout = {
    ...baseLayout(theme, compact),
    height,
    showlegend: false,
    bargap: 0.28,
    margin: compact ? { l: 78, r: 34, t: 16, b: 44 } : { l: 104, r: 46, t: 16, b: 52 },
    xaxis: {
      ...axisStyle(theme),
      range: [0, 100],
      ticksuffix: "%",
      title: { text: "Score [%] ↑", font: { color: colors.text2 } },
    },
    yaxis: { ...axisStyle(theme), automargin: true, title: { text: "" } },
  };

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ ...PLOT_CONFIG, displayModeBar: !compact }}
      divId="explainer_fig"
      useResizeHandler
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}

/* ========================================================================== */
/* Tables                                                                      */
/* ========================================================================== */

function compareValues(a, b, direction) {
  const missingA = isMissing(a);
  const missingB = isMissing(b);
  if (missingA && missingB) return 0;
  if (missingA) return 1; // empty cells always sink
  if (missingB) return -1;
  const numberA = Number(a);
  const numberB = Number(b);
  const numeric = Number.isFinite(numberA) && Number.isFinite(numberB) && typeof a !== "string";
  const result = numeric ? numberA - numberB : String(a).localeCompare(String(b), "en", { sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

function ResultsTable({ columns, rows, rowKey, selected, onSelect, defaultSort, emptyMessage, caption }) {
  const [sort, setSort] = useState(defaultSort || null);
  const [showSecondary, setShowSecondary] = useState(false);
  /* Below 700px every cell becomes its own line, so the five sub-score columns
     would turn each explainer into a nine-line block. */
  const narrow = useMediaQuery("(max-width: 700px)");
  const hasSecondary = columns.some((column) => column.secondary);
  const visibleColumns = narrow && !showSecondary ? columns.filter((column) => !column.secondary) : columns;

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const copy = rows.slice();
    copy.sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.direction));
    return copy;
  }, [rows, sort]);

  const onHeaderClick = (key, type) =>
    setSort((current) =>
      current && current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: type === "score" || type === "number" ? "desc" : "asc" }
    );

  if (!rows.length) {
    return (
      <div className="table-card">
        <p className="table-empty">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      {narrow && hasSecondary && (
        <div className="table-toolbar">
          <button type="button" className="btn btn--sm" onClick={() => setShowSecondary((value) => !value)}>
            {showSecondary ? "Hide sub-scores" : "Show sub-scores"}
          </button>
          <span>{rows.length} rows</span>
        </div>
      )}
      <div className="table-scroll">
        <table className="rtable">
          {caption && <caption className="visually-hidden">{caption}</caption>}
          <thead>
            <tr>
              {visibleColumns.map((column) => {
                const isSorted = sort && sort.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className="is-sortable"
                    aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                    onClick={() => onHeaderClick(column.key, column.type)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onHeaderClick(column.key, column.type);
                      }
                    }}
                    tabIndex={0}
                    role="columnheader"
                  >
                    {column.label}
                    <span className="sort-arrow" aria-hidden="true">
                      {isSorted ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => {
              const key = rowKey ? row[rowKey] : index;
              const isSelected = selected !== undefined && row[rowKey] === selected;
              return (
                <tr
                  key={`${key}-${index}`}
                  className={`${onSelect ? "is-clickable" : ""}${isSelected ? " is-selected" : ""}`}
                  onClick={onSelect ? () => onSelect(row[rowKey]) : undefined}
                  tabIndex={onSelect ? 0 : undefined}
                  onKeyDown={
                    onSelect
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelect(row[rowKey]);
                          }
                        }
                      : undefined
                  }
                >
                  {visibleColumns.map((column) => (
                    <Cell key={column.key} column={column} value={row[column.key]} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ column, value }) {
  if (column.type === "score") {
    const score = formatScore(value);
    return (
      <td className="is-num" data-label={column.label}>
        {score === null ? (
          <span className="muted">—</span>
        ) : (
          <span className="scorecell">
            <span className="scorecell__num">{score}</span>
            <span className="scorecell__bar">
              <span
                className="scorecell__fill"
                style={{ width: `${Math.max(0, Math.min(100, Number(score)))}%` }}
              />
            </span>
          </span>
        )}
      </td>
    );
  }

  if (column.type === "seconds") {
    const seconds = formatSeconds(value);
    return (
      <td className="is-num" data-label={column.label}>
        {seconds === null ? <span className="muted">—</span> : seconds}
      </td>
    );
  }

  if (column.type === "number") {
    return (
      <td className="is-num" data-label={column.label}>
        {isMissing(value) ? <span className="muted">—</span> : Number(value).toLocaleString("en-US")}
      </td>
    );
  }

  return (
    <td className={column.primary ? "is-primary" : ""} data-label={column.label}>
      {isMissing(value) ? <span className="muted">—</span> : String(value)}
    </td>
  );
}

/* ========================================================================== */
/* Explainer details                                                           */
/* ========================================================================== */

function ExplainerDetails({ result, explainer }) {
  const rows = toRows(result);
  const row = rows[0];

  if (!row) {
    return (
      <p className="muted">
        No description available for <strong>{explainer}</strong> in the database yet.
      </p>
    );
  }

  return (
    <dl className="deflist">
      {result.columns.map((column) => (
        <React.Fragment key={column}>
          <dt>{column}</dt>
          <dd>
            {column === "Original paper" ? (
              <Citation raw={row[column]} />
            ) : column === "Source code" ? (
              <SourceCode value={row[column]} />
            ) : (
              renderText(row[column], column)
            )}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function SourceCode({ value }) {
  if (isMissing(value)) return <span className="muted">Not documented yet.</span>;
  const url = String(value).trim();
  if (!/^https?:\/\//.test(url)) return <span>{url}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {url.replace(/^https?:\/\//, "").replace(/\/$/, "")} <IconExternal style={{ width: 13, height: 13 }} />
    </a>
  );
}

function Citation({ raw }) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const citation = parseBibtex(raw);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!citation) return renderText(raw, "paper");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citation.raw);
      setCopied(true);
    } catch (error) {
      setShowRaw(true); // clipboard blocked: at least reveal the entry
    }
  };

  return (
    <div className="stack-sm">
      <div>
        {citation.title && <span className="bib-title">{citation.title}</span>}
        <div className="bib-meta">
          {[formatAuthors(citation.authors), citation.venue, citation.year].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn--sm" onClick={() => setShowRaw((value) => !value)}>
          {showRaw ? "Hide BibTeX" : "Show BibTeX"}
        </button>
        <button type="button" className="btn btn--sm" onClick={copy}>
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? "Copied" : "Copy BibTeX"}
        </button>
        {citation.url && (
          <a className="btn btn--sm" href={citation.url} target="_blank" rel="noopener noreferrer">
            <IconExternal /> Open
          </a>
        )}
      </div>
      {showRaw && <pre className="bibtex">{citation.raw}</pre>}
    </div>
  );
}

