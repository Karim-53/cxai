import { useCallback, useEffect, useState } from "react";

export const STORAGE_KEY = "cxai-theme";

/* Chart colours mirror the CSS custom properties in styles.css. Both modes are
   picked for their own surface (a dark chart is not a flipped light chart). */
export const PALETTE = {
  light: {
    surface: "#fcfcfb",
    grid: "#e3e1db",
    axis: "#cfccc4",
    text1: "#0b0b0b",
    text2: "#52514e",
    text3: "#78766f",
    series1: "#2a78d6",
    series2: "#eb6834",
    hoverBg: "#ffffff",
  },
  dark: {
    surface: "#1a1a19",
    grid: "#35352f",
    axis: "#4a4a43",
    text1: "#ffffff",
    text2: "#c3c2b7",
    text3: "#97968c",
    series1: "#3987e5",
    series2: "#d95926",
    hoverBg: "#232320",
  },
};

export const FONT_STACK =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function prefersDark() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function storedTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch (error) {
    return null; // private mode / disabled storage
  }
}

/** Media query hook with the legacy addListener fallback (Safari < 14). */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(list.matches);
    if (list.addEventListener) list.addEventListener("change", onChange);
    else list.addListener(onChange);
    return () => {
      if (list.removeEventListener) list.removeEventListener("change", onChange);
      else list.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/** Resolved colour scheme + toggle. The inline script in index.html applies the
 *  same rule before first paint so the page never flashes the wrong theme. */
export function useTheme() {
  const [choice, setChoice] = useState(() => storedTheme());
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = choice || (systemDark ? "dark" : "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#131312" : "#f5f4f1");
  }, [theme]);

  const toggle = useCallback(() => {
    setChoice((current) => {
      const next = (current || (prefersDark() ? "dark" : "light")) === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (error) {
        /* ignore storage failures */
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}

/** Shared Plotly layout: transparent surfaces so the card behind shows through,
 *  recessive grid, theme-aware text. */
export function baseLayout(theme, compact) {
  const c = PALETTE[theme];
  return {
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: FONT_STACK, size: compact ? 11 : 13, color: c.text2 },
    hoverlabel: {
      bgcolor: c.hoverBg,
      bordercolor: c.grid,
      font: { family: FONT_STACK, size: compact ? 11 : 13, color: c.text1 },
      align: "left",
    },
    modebar: { bgcolor: "rgba(0,0,0,0)", color: c.text3, activecolor: c.series1 },
  };
}

export function axisStyle(theme) {
  const c = PALETTE[theme];
  return {
    gridcolor: c.grid,
    zerolinecolor: c.grid,
    linecolor: c.axis,
    tickcolor: c.axis,
    tickfont: { color: c.text3 },
    title: { font: { color: c.text2 } },
  };
}

export const PLOT_CONFIG = {
  responsive: true,
  displaylogo: false,
  scrollZoom: false,
  modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "hoverClosestCartesian", "hoverCompareCartesian"],
  toImageButtonOptions: { format: "png", scale: 2 },
};
