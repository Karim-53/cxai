/* SQL layer: filter tree, query builders and a safe exec helper.
   Each statement is executed on its own: sql.js drops the result of any
   statement that returns zero rows, so running them in one batch and indexing
   into the array silently shifted every result once a filter emptied a query. */

export const CATEGORIES = ["fidelity", "fragility", "stability", "simplicity", "stress"];

export const CATEGORY_DEFINITION = {
  fidelity: "Test if the xAI' output reflects the underlying model.",
  fragility: "Test if the xAI output is easily manipulable on purpose.",
  stability: "Test if the xAI output is too sensitive to slight changes in the dataset/model.",
  simplicity: "Users should be able to look at the explanation, and reason about model behavior.",
  stress: "Test whether the xAI can explain models trained on big data.",
};

export const NODES = [
  {
    value: "main_checklist",
    label: "Filters:",
    showCheckbox: false,
    children: [
      {
        value: "supported_model_checklist",
        label: "I need to explain specific AI model(s):",
        children: [
          { value: "supported_model_model_agnostic", label: "Any (Model agnostic xAI alg.)", sql: "xai.supported_model_model_agnostic = 1" },
          { value: "supported_model_tree_based", label: "Tree-based", sql: "xai.supported_model_tree_based = 1" },
          { value: "supported_model_neural_network", label: "Neural Network", sql: "xai.supported_model_neural_network = 1" },
        ],
      },
      {
        value: "required_output_checklist",
        label: "I need specific output(s) from the xAI:",
        children: [
          { value: "output_importance", label: "Feature importance (Global Explanation)", sql: "xai.output_importance = 1" },
          { value: "output_attribution", label: "Feature attribution (Local Explanation)", sql: "xai.output_attribution = 1" },
          { value: "output_interaction", label: "Pair feature interaction (Under development)", sql: "xai.output_interaction = 1" },
        ],
      },
      {
        value: "required_input_data_",
        label: "Check if we can NOT provide the following information to the xAI algorithm:",
        children: [
          { value: "required_input_X_reference", label: "A reference input data", sql: "xai.required_input_X_reference = 0" },
          { value: "required_input_truth_to_explain", label: "Target values of the data points to explain (i.e. truth, not prediction)", sql: "xai.required_input_truth_to_explain = 0" },
        ],
      },
      {
        value: "explainer_input_xai_",
        label: "Check if we can NOT execute the following operations on the AI model:",
        children: [
          { value: "required_input_predict_func", label: "Perform addional predictions.", sql: "xai.required_input_predict_func = 0" },
        ],
      },
      {
        value: "test_adversarial_attacks",
        label: "I trust the xAI's output (I created the data and the model myself)",
        sql: "t.category != 'fragility'",
      },
    ],
  },
];

const NODE_SQL = {};
(function flatten(nodes) {
  nodes.forEach((node) => {
    if (node.sql) NODE_SQL[node.value] = node.sql;
    if (node.children) flatten(node.children);
  });
})(NODES);

export const FILTER_IDS = Object.keys(NODE_SQL);

/** Human readable column headers for the overview table. */
export const COLUMN_LABEL = {
  explainer: "Explainer",
  average_score: "Average score [%]",
  time_per_test: "Time per test [s]",
  eligible_points: "Completed tests",
  percentage_fidelity: "Fidelity [%]",
  percentage_fragility: "Fragility [%]",
  percentage_stability: "Stability [%]",
  percentage_simplicity: "Simplicity [%]",
  percentage_stress: "Stress test [%]",
};

/** Single-quote escaping - explainer names come from the database, not from a
 *  text input, but string concatenation without escaping still broke as soon as
 *  a name contained an apostrophe. */
const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

const conditions = (checked) => (checked || []).filter((id) => id in NODE_SQL).map((id) => NODE_SQL[id]);

const whereClause = (checked, extra = []) => {
  const all = extra.concat(conditions(checked));
  return all.length ? `WHERE ${all.join("\n  AND ")}\n` : "";
};

const PERCENTAGE_PER_CATEGORY = CATEGORIES
  .map((c) => `  ROUND(AVG(CASE category WHEN '${c}' THEN score END) * 100.0, 1) AS percentage_${c}`)
  .join(",\n");

export const overviewSql = (checked) => `
SELECT c.explainer,
       xai.time_per_test AS time_per_test,
       COUNT(c.score) AS eligible_points,
${PERCENTAGE_PER_CATEGORY}
FROM cross_tab AS c
LEFT JOIN test AS t ON c.test = t.test
LEFT JOIN explainer AS xai ON c.explainer = xai.explainer
${whereClause(checked)}GROUP BY c.explainer;`;

export const keptTestsSql = (checked) => `
SELECT COUNT(DISTINCT c.test_subtest) AS kept_tests
FROM cross_tab AS c
LEFT JOIN test AS t ON c.test = t.test
LEFT JOIN explainer AS xai ON c.explainer = xai.explainer
${whereClause(checked)};`;

export const TOTALS_SQL = `
SELECT COUNT(DISTINCT c.test_subtest) AS total_eligible_points,
       COUNT(DISTINCT c.explainer) AS total_explainers,
       MAX(c.last_updated) AS last_updated
FROM cross_tab AS c;`;

export const detailsSql = (explainer) => `
SELECT xai.description AS 'xAI description',
       xai.supported_models AS 'Supported AI models',
       xai.outputs AS 'xAI outputs',
       xai.required_input_data AS 'Required info by the xAI',
       p.source_paper_bibliography AS 'Original paper',
       xai.source_code AS 'Source code'
FROM explainer AS xai
LEFT JOIN paper AS p ON xai.source_paper_tag = p.source_paper_tag
WHERE xai.explainer = ${quote(explainer)};`;

/** Table 2 - detailed scoring of one explainer, restricted to the tests kept by
 *  the active filters (the page text always claimed this; the query did not). */
export const testsSql = (explainer, checked) => `
SELECT t.short_description AS 'Test',
       ROUND(c.score * 100.0, 1) AS 'Score [%]',
       t.category AS 'Category',
       c.tested_xai_output AS 'Tested xAI output'
FROM cross_tab AS c
LEFT JOIN test AS t ON c.test = t.test
LEFT JOIN explainer AS xai ON c.explainer = xai.explainer
${whereClause(checked, [`c.explainer = ${quote(explainer)}`, "c.score IS NOT NULL"])}ORDER BY c.score ASC;`;

/** Runs one statement and always returns a table shape, even when empty. */
export function queryOne(db, statement) {
  const result = db.exec(statement);
  return result.length ? result[0] : { columns: [], values: [] };
}

/** Turns a sql.js result into an array of row objects. */
export function toRows({ columns, values }) {
  return values.map((row) => {
    const object = {};
    columns.forEach((column, i) => { object[column] = row[i]; });
    return object;
  });
}
