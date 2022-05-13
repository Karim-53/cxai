// some sql.js op https://phiresky.github.io/blog/2021/hosting-sqlite-databases-on-github-pages/
import React, { useState, useEffect } from "react";
import "./styles.css";
import initSqlJs from "sql.js"; // https://sql.js.org/#%2F=     test env https://sql.js.org/examples/GUI/index.html
import pf from 'pareto-frontier';
import DB from './database';
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm"; // Required to let webpack 4 know it needs to copy the wasm file to our assets
import Plot from 'react-plotly.js';
import CheckboxTree from 'react-checkbox-tree';  // https://jakezatecky.github.io/react-checkbox-tree/
import "react-checkbox-tree/lib/react-checkbox-tree.css";  // https://github.com/jakezatecky/react-checkbox-tree   
// import DataTable from 'react-data-table-component'; todo [after acceptance] https://datatables.net/
import jump from "./jump.js";
const nodes = [
{
  value: 'main_checklist',
  label: 'Filter:',
  children: [
{ // todo include all of them in one big node "Filter:"
  value: 'supported_model_checklist',
  label: 'I need to explain specific AI model(s):',
  children: [
      { value: 'supported_model_model_agnostic', label: 'Any (Model agnostic xAI alg.)', sql:'xai.supported_model_model_agnostic = 1' },
      { value: 'supported_model_tree_based', label: 'Tree-based', sql:'xai.supported_model_tree_based = 1' },
      { value: 'supported_model_neural_network', label: 'Neural Network', sql:'xai.supported_model_neural_network = 1'  },
  ],
},
{
  value: 'required_output_checklist',
  label: 'I need specific output(s) from the XAI:',
  children: [
      { value: 'output_importance', label: 'Feature importance (Global Explanation)', sql:'xai.output_importance = 1'},
      { value: 'output_attribution', label: 'Feature attribution (Local Explanation)', sql:'xai.output_attribution = 1' }, //  # We discuss the attribution problem, i.e., the problem of distributing the prediction score of a model for a specific input to its base features (cf. [15, 10, 19]); the attribution to a base feature can be interpreted as the importance of the feature to the prediction. https://arxiv.org/pdf/1908.08474.pdf
      { value: 'output_interaction', label: 'Pair feature interaction (Global Explanation)', sql:'xai.output_interaction = 1' },
      // # Definition 1 (Statistical Non-Additive Interaction). A function f contains a statistical non-additive interaction of multiple features indexed in set I if and only if f cannot be decomposed into a sum of |I| subfunctions fi , each excluding the i-th interaction variable: f(x) =/= Sum i∈I fi(x\{i}).
      // #  Def. 1 identifies a non-additive effect among all features I on the output of function f (Friedman and Popescu, 2008; Sorokina et al., 2008; Tsang et al., 2018a). see https://arxiv.org/pdf/2103.03103.pdf
      // # todo [after acceptance] we need a page with a clear description of each option
      // { value: 'todo1', label: '#Future work: Pair interaction (Local Ex), multi F interaction, NLP, debugging ...', disabled:true  }
  ]
},
{ value: 'required_input_data_', label: 'Check if we can NOT provide the following information to the xAI algorithm:',
  children: [
      { value: 'required_input_X_reference', label: 'A reference input data', sql:'xai.required_input_X_reference = 0' },
      { value: 'required_input_truth_to_explain', label: 'Target values of the data points to explain (truth, not prediction)', sql:'xai.required_input_truth_to_explain = 0' },
  ]
},
{ value: 'explainer_input_xai_', label: 'Check if we can NOT execute the following operations on the AI model:',
  children: [
      { value: 'required_input_predict_func', label: 'Perform addional predictions.', sql:'xai.required_input_predict_func = 0' }
      // { value: 'required_input_train_function', label: '#Future work: Retrain the model.', disabled:true },
  ]
},
{ value: 'test_adversarial_attacks', label: 'I trust the xAI output (I created the data and the model myself)', sql: "t.category != 'fragility'"}
// { value: 'assumptions_data_distribution_iid', label: '#Future work: Assume input features to be independent and identically distributed', disabled:true },
// { value: 'explainer_need_gpu', label: '#Future work: Constraint on hardware equipement: xAI alg. require a GPU.', disabled:true }
// {
//   value: 'uid',
//   label: 'visible'
// },
]}];

var node_sql = {}
function flatten_nodes(nodes, node_sql){
  nodes.map( x => {if ('sql' in x) node_sql[x.value]= x.sql})
  nodes.map( x => {if ('children' in x) flatten_nodes(x.children, node_sql)})
}
flatten_nodes(nodes, node_sql)

function average(data) {
  /*Can't find an average function in JS, made one
  This function is able to handle null values!!!*/
    var count = null;
    var sum = null;
    for (let i=0; i<data.length; i++) {
      if (data[i]) {
        count++;
        sum = sum + data[i];
      }
    }
    if (count) {var average = Number( sum / count)} else { average=null}
    return average;
  }
// if (window.location.href.includes("localhost")) { console.log('localhost');}

const categories = ['fidelity', 'fragility', 'stability', 'simplicity', 'stress']  // todo get it from db
const pecentage_per_category = categories.map(category => ' ROUND(AVG(case category when \''+category+'\' then score end)*100.0,1) AS percentage_'+category).join(',\n ');

export default function App() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(async () => {
    // sql.js needs to fetch its wasm file, so we cannot immediately instantiate the database
    // without any configuration, initSqlJs will fetch the wasm files directly from the same path as the js
    // see ../craco.config.js
    try {
      const sqlPromise = initSqlJs({ locateFile: () => sqlWasm });
      const dataPromise = fetch(DB).then(res => res.arrayBuffer()).catch((error) => {
        console.log('File not found:')
        console.log(error)
      });
      const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
      console.log('sql ok.')
      setDb(new SQL.Database(new Uint8Array(buf)));
    } catch (err) {
      console.log('sql error:')
      setError(err);
    }
  }, []);

  if (error) return <pre>{error.toString()}</pre>;
  else if (!db) return <pre>Loading...</pre>;
  else return <SQLRepl db={db} />;
}

function to_dict(arr){
  let dico = {}
  for(let i = 0; i < arr.length; i++){
      dico[arr[i]] = i;
  }
  return dico
}
const arrayColumn = (arr, n) => arr.map(x => x[n]);
const average_score = (arr, dico) => arr.map(x => average( categories.map(c => x[dico['percentage_' + c]])));

function sql(explainer, checked){
  var where = checked.filter(checkbox_id => checkbox_id in node_sql).map( x => node_sql[x]).join(' AND ')
  if (where.length > 0) where = 'Where ' + where + ' \n'
  const r = `
  --0 For Plotly
  SELECT	c.explainer,
ROUND(AVG(c.time),2) AS time_per_test,
count(c.score) AS eligible_points,
` + pecentage_per_category + ` 
FROM cross_tab AS c
Left JOIN test AS t ON c.test = t.test
Left JOIN explainer AS xai ON c.explainer = xai.explainer
` + where + ` 
GROUP BY c.explainer;

--1 details about the selected explainer
SELECT	description, p.source_paper_bibliography, source_code, supported_models, outputs, required_input_data
FROM explainer AS xai
Left JOIN paper AS p ON xai.source_paper_tag = p.source_paper_tag
Where (explainer = '`+explainer+`');

--2 detailed scoring of the selected explainer
SELECT	test.short_description AS '  ______Short_description______  ',
ROUND(score,2) AS Score, category AS 'test category',
tested_xai_output AS 'Tested_xAI_output________'
--  test.test, subtest no ROUND(time) to make things readable
FROM cross_tab
Left JOIN test ON cross_tab.test = test.test
Where (explainer = '`+explainer+`') and (score IS NOT NULL)
Order By 'test category';
-- order also by test_subtest, 'Tested_xAI_output________';

--3 Kept Unit tests
SELECT	count(DISTINCT c.test_subtest) AS kept_tests
FROM cross_tab AS c
Left JOIN test AS t ON c.test = t.test
Left JOIN explainer AS xai ON c.explainer = xai.explainer
` + where + `;

--4 total xAi and tests
SELECT	count(DISTINCT c.test_subtest) AS total_eligible_points,
    	count(DISTINCT c.explainer) AS total_explainers
FROM cross_tab AS c;
`;
// console.log(r)
return r
}
/**
 * A simple SQL read-eval-print-loop
 * @param {{db: import("sql.js").Database}} props
 */
function SQLRepl({ db }) {
  const [selected_explainer, setExplainer] = useState('kernel_shap');
  const [checked, setChecked] = useState(['output_importance']);
  const [expanded, setExpanded] = useState([]);
  const [results, setResults] = useState(db.exec(sql(selected_explainer, checked)));
  const [error, setError] = useState(null);
  
  // console.log(sql(selected_explainer));
  // console.log('checked', checked);
  function sql_exec(new_sql) {
    try {
      // The sql is executed synchronously on the UI thread. You may want to use a web worker here instead
      setResults(db.exec(new_sql)); // an array of objects is returned
      setError(null);
    } catch (err) {
      // exec throws an error when the SQL statement is invalid
      setError(err);
      setResults([]);
    }
  }

  function plotly_click(data){
    console.log('plotly_click:')
    console.log(data)
    console.log(data.points) 
  
    let explainer = data.points[0].text
  
    setExplainer(explainer)
    jump('explainer_limits')
  }
  var df;
  df = results[0];
  var column = to_dict(df.columns);

  const percentage = average_score(df.values, column)
  const time_per_test = arrayColumn(df.values, column['time_per_test']);
  const eligible_points = arrayColumn(df.values, column['eligible_points']);
  const text = arrayColumn(df.values, column['explainer']);
  
  const kept_xai = df.values.length
  const kept_tests = results[3].values[0][0]
  const total_eligible_points = results[4].values[0][0]
  const total_explainers = results[4].values[0][1]
  var merged = []
  for (let i = 0; i < time_per_test.length; i++) {
    merged.push([percentage[i], time_per_test[i]]);
  }
  const pareto = pf.getParetoFrontier(merged, { optimize: 'bottomRight' });

  const pareto_time_per_test = arrayColumn(pareto, 1);
  const pareto_percentage = arrayColumn(pareto, 0);

  // }


  const trace1 = { // todo after acceptance Plotly.animate('graph', { https://plotly.com/javascript/plotlyjs-function-reference/#plotlyanimate
    x: time_per_test,
    y: percentage,
    mode: 'markers+text',
    type: 'scatter',
    name: 'Explainers',
    text: text, // hover https://plotly.com/javascript/reference/
    textposition: 'top center',
    textfont: {
      family:  'Raleway, sans-serif'
    },
    // legendgroup:"exp", // did not help :(
    // showlegend:true,
    marker: {
      size: eligible_points.map(x => 2*x),
      // showlegend:true, // did not help :(
      // legendgroup:"size",
     }
  };


  // const trace1_legend = {
  //   x: time_per_test,
  //   y: percentage,
  //   mode: 'markers+text',
  //   type: 'scatter',
  //   text: text, // hover https://plotly.com/javascript/reference/
  //   textposition: 'top center',
  //   textfont: {
  //     family:  'Raleway, sans-serif'
  //   },
  //   marker: { size: eligible_points.map(x => 2*x) },



  //   legendgroup: "size",
  //   visible:"legendonly",
  //   name: 'Portability: completed tests without failiure',
  // }

  const trace2 = {
    x: pareto_time_per_test,
    y: pareto_percentage,
    mode: 'lines',
    type: 'scatter',
    name: 'Pareto front',
    // text: ['B-a', 'B-b', 'B-c', 'B-d', 'B-e'],
    textfont : {
      family:'Times New Roman'
    },
    textposition: 'bottom center',
    // marker: { size: 6 }
  };
  const data = [ trace1, trace2 ];

  const layout = {
    width: 900,
    height: 580,
    xaxis: {
      // range: [ 0.75, 5.25 ],
      type: 'log',
      autorange: true,
      title: {
        text: 'Fast alg. <--     Average Time per test [Seconds] ↓     --> Slow alg.'
      }
    },
    yaxis: {
      range: [1, 100],
      title: {
        text: 'Poor <--  Average Score per test [%] ↑  --> Excelent'
      }
    },
    legend: {
      "tracegroupgap": 20,
      y: 1,
      yref: 'paper',
      font: {
        family: 'Arial, sans-serif',
        // size: 20,
        // color: 'grey',
      },
    },
    annotations: [
      {
        x: 0.01,
        y: 100,
        xref: 'paper',
        yref: 'y',
        text: 'Best xAI(s) are close to this point',
        showarrow: true,
        arrowhead: 7,
        ax: 15 ,
        ay: -35,
        font: {color:'#636363'},
        arrowcolor:'#636363',
      }
    ],

    title:{
      text:"Global overview of the explainers' performance<br><b>Tip</b>: Click on an explainer for more details",
    }
  };  // todo [after acceptance] autosize: true, https://dev.to/dheerajmurali/building-a-responsive-chart-in-react-with-plotly-js-4on8

  const explainer_df = results[1]
  const explainer_column = to_dict(explainer_df.columns);
  const explainer_row = df.values.filter(row => row[column['explainer']] == selected_explainer )


  const explainer_cat_scores = (explainer_row.length > 0) ? categories.map(c => explainer_row[0][column['percentage_' + c]]) : categories.map(c => null)
  const explainer_error = (explainer_row.length > 0) ? '' : `With the applied filters, none of remaining unit tests could be applied on this explainer,
  please select another one by clicking on a blue dot in the first figure.`
  // console.log(df.columns)
  // console.log(explainer_row)
  
  const explainer_scores = [{
    type: 'bar',
    x: explainer_cat_scores, // todo handel nan values
    y: categories,
    text: explainer_cat_scores,
    orientation: 'h'
  }];

  const explainer_layout = {
    title: 'Score per category',
    font:{
      family: 'Raleway, sans-serif'
    },
    showlegend: false,
    xaxis: {
      tickangle: -45,
      range: [1, 100],
      title: {
        text: 'Score [%] ↑'
      }
    },
    yaxis: {
      // zeroline: false,
      gridwidth: 2,
      title: {
        text: 'Sub scoring cartegories'
      }
    },
    bargap :0.05
  };

  const too_much_filters = (kept_xai<=1) ? "None of the indexed xAI satisfy the selected constrains. Please use less filters." : ""

  return (
    // todo add fork me on github
    <div className="App">
      <pre className="error">{(error || "").toString()}</pre>
      <h1 id='Filters' >1. shortlist xAI that fit your needs:</h1>
      <pre>Use the filters below to describe the xAI model and the dataset you would like to explain. <a href="filters.html">Click here to learn more about each constrain.</a></pre>

      <pre>
        <CheckboxTree
            nodes={nodes}
            checked={checked}
            expanded={expanded}
            onCheck={checked => {sql_exec(sql(selected_explainer, checked));setChecked(checked); }}
            onExpand={expanded => setExpanded(expanded)}
            showExpandAll={true}
        />
      </pre>
      <pre>Using the selected filters, we keep <b> {kept_xai} xAI tool(s) out of {total_explainers}</b> and <b>{kept_tests} Unit-test(s) out of {total_eligible_points}</b>.   </pre>
      <pre className="error">{(too_much_filters || "").toString()}</pre>
      <pre>Below, we test every xAI on these {kept_tests} unit-test(s). Every unit-test evaluate a specific aspect of the xAI algorithm (the <b>fidelity</b> of the explanation to the AI behavior, the <b>stability</b> xAi against minor change in the AI, etc.). <a href="test/index.html">Learn more about implemented unit-tests and how the selection was done.</a></pre>

      <h1 id='Overview_Plot' >2. Evaluate selected xAI using an intuitive scoring method:</h1>
      <pre>The bubble plot below summarizes the average performance of the selected xAI(s): time on x-axis v.s. score in percentage on y-axis.<br/>
A perfect xAI should obtain a score of 100% and finish all {kept_tests} tests in the smallest amount of time. Therefore, it would be located on top right.<br/>
Moreover, some xAI might break while running, because of algorithmic/implementation issues. The dot size represent the number of tests completed without failiure. Thus, a higher portability is described with a bigger dot.<br/>
<a href="filters.html">Learn more about the overview plot.</a>
</pre>
      <Plot
        data={data}
        layout={layout}
        onClick={plotly_click}
        onHover={data => document.getElementsByClassName('nsewdrag')[0].style.cursor = 'pointer'}
        onUnhover={data => document.getElementsByClassName('nsewdrag')[0].style.cursor = ''}
        divId={'fig'}
      />
            <pre>You can see the detailed scoring in the table below of the values .......</pre>

      {/* on hover help https://reactjs.org/docs/events.html */}

      <pre>
          <ResultsTable columns={results[0].columns} values={results[0].values} />
          <pre class="fig_title"><b>Table 1:</b> Subscores given the selected filters.</pre>
      </pre>

      <h1 id='explainer_limits' >{selected_explainer} Explainer: (See the limit of the selected xAI)</h1>
      <div>
        {/* <pre id="description"><b>Description:</b> {explainer_description}</pre> */
        explainer_df.columns.map((explainer_property, i) => (
            <pre><b>{explainer_property}:</b> {explainer_df.values[0][explainer_column[explainer_property]]}</pre> 
          ))
        }
      </div>
      
      <pre className="error">{(explainer_error || "").toString()}</pre>
      <Plot
        data={explainer_scores}
        layout={explainer_layout}
        divId={'explainer_fig'}
      />

      <h2>Score per test:</h2>

      <pre>
        {
          // results contains one object per select statement in the query
          // results.map(({ columns, values }, i) => (
          //   <ResultsTable key={i} columns={columns} values={values} />
          // ))
          <ResultsTable columns={results[2].columns} values={results[2].values}/>
        }
        <pre class="fig_title"><b>Table 2:</b> Score obtained by <b>{selected_explainer} explainer</b> for each test.</pre>
      </pre>
    </div>
  );
}

/**
 * Renders a single value of the array returned by db.exec(...) as a table
 * @param {import("sql.js").QueryExecResult} props
 */
function ResultsTable({ columns, values }) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((columnName, i) => (
            <td key={i}>{columnName}</td>
          ))}
        </tr>
      </thead>

      <tbody>
        {
          // values is an array of arrays representing the results of the query
          values.map((row, i) => (
            <tr key={i}>
              {row.map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}
