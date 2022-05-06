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
  
{ // todo include all of them in one big node "Filter:"
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
      { value: 'todo1', label: '#Future work: Pair interaction (Local Ex), multi F interaction, NLP, debugging ...', disabled:true  }
  ]
},
{
  value: 'required_input_data_',
  label: 'Check if we can NOT provide the following information to the xAI algorithm:',
  children: [
      { value: 'required_input_X_reference', label: 'A reference input data', sql:'xai.required_input_X_reference = 0' },
      { value: 'required_input_truth_to_explain', label: 'Target values of the data points to explain (truth, not prediction)', sql:'xai.required_input_truth_to_explain = 0' },
  ]
},
{
  value: 'explainer_input_xai_',
  label: 'Check if we can NOT execute the following operations on the AI model:',
  children: [
      { value: 'required_input_predict_func', label: 'Perform addional predictions.', sql:'xai.required_input_predict_func = 0' },
      { value: 'required_input_train_function', label: '#Future work: Retrain the model.', disabled:true },
  ]
},
{
  value: 'test_adversarial_attacks',
  label: 'I trust the xAI output (I created the data and the model myself)',
  sql: "t.category != 'fragility'"
},
{
  value: 'assumptions_data_distribution_iid',
  label: '#Future work: Assume input features to be independent and identically distributed', disabled:true 
},
{
  value: 'explainer_need_gpu',
  label: '#Future work: Constraint on hardware equipement: xAI alg. require a GPU.', disabled:true 
}
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
if (window.location.href.includes("localhost")) { console.log('localhost');}

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
const average_score = (arr, dico) => arr.map(x => average([x[dico['percentage_fidelity']],x[dico['percentage_stability']]]));

function sql(explainer, checked){
  var where = checked.filter(checkbox_id => checkbox_id in node_sql).map( x => node_sql[x]).join(' AND ')
  if (where.length > 0) where = 'Where ' + where + ' \n'
  const r = `SELECT	c.explainer,
ROUND(AVG(c.time),2) AS time_per_test,
count(c.score) AS eligible_points,
` + pecentage_per_category + ` 
FROM cross_tab AS c
Left JOIN test AS t ON c.test = t.test
Left JOIN explainer AS xai ON c.explainer = xai.explainer
` + where + ` 
GROUP BY c.explainer;

SELECT	category AS test_category, test.test, subtest, ROUND(score,2), ROUND(time),
test.description AS test_description
FROM cross_tab
Left JOIN test ON cross_tab.test = test.test
Where (explainer = '`+explainer+`') and (score IS NOT NULL)
Order By test_category, test_subtest;
`;
console.log(r)
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
  console.log('checked', checked);
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
    jump('explainer_title')
  }
  console.log('passed explainer', selected_explainer)
  console.log(results)
  console.log(error)
  var df;
  df = results[0];
  var column = to_dict(df.columns);

  //const percentagefidelity = arrayColumn(df.values, column['percentagefidelity']);
  const percentage = average_score(df.values, column)
  // const percentage = arrayColumn(df.values, column['percentage']);
  const time_per_test = arrayColumn(df.values, column['time_per_test']);
  const eligible_points = arrayColumn(df.values, column['eligible_points']);
  const text = arrayColumn(df.values, column['explainer']);
  console.log(df)

  var merged = []
  for (let i = 0; i < time_per_test.length; i++) {
    merged.push([percentage[i], time_per_test[i]]);
  }
  const pareto = pf.getParetoFrontier(merged, { optimize: 'bottomRight' });

  const pareto_time_per_test = arrayColumn(pareto, 1);
  const pareto_percentage = arrayColumn(pareto, 0);

  // }


  var trace1 = { // todo after acceptance Plotly.animate('graph', { https://plotly.com/javascript/plotlyjs-function-reference/#plotlyanimate
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
    marker: { size: eligible_points }
  };

  var trace2 = {
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
  var data = [ trace1, trace2 ];

  var layout = {
    xaxis: {
      // range: [ 0.75, 5.25 ],
      type: 'log',
      autorange: true,
      title: {
        text: 'Average Time per test [Seconds] ↓'
      }
    },
    yaxis: {
      // range: [0, 100], todo
      title: {
        text: 'Score [%] ↑'
      }
    },
    legend: {
      y: 1,
      yref: 'paper',
      font: {
        family: 'Arial, sans-serif',
        // size: 20,
        // color: 'grey',
      }
    },

    title:"Global overview of the explainers' performance<br><b>Tip</b>: Click on an explainer for more details"
  };  // todo [after acceptance] autosize: true, https://dev.to/dheerajmurali/building-a-responsive-chart-in-react-with-plotly-js-4on8

  // Plotly.newPlot('myDiv', data, layout);




  return (
    <div className="App">
      <Plot
        data={data}
        layout={layout}
        onClick={plotly_click}
        onHover={data => document.getElementsByClassName('nsewdrag')[0].style.cursor = 'pointer'}
        onUnhover={data => document.getElementsByClassName('nsewdrag')[0].style.cursor = ''}
        divId={'fig'}
      />
      {/* <h1>Filters</h1>  */}
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
      {/* Kept XAI 11 / 11  Kept tests 18 / 18 */}
      {/* on hover help https://reactjs.org/docs/events.html */}

      <h1 id='explainer_title' >{selected_explainer} Explainer:</h1>

      {/* <textarea
        onChange={(e) => sql_exec(e.target.value)}
        placeholder="Enter some SQL. No inspiration ? Try “select sqlite_version()”"
      ></textarea> */}

      <pre className="error">{(error || "").toString()}</pre>

      <pre>
        {
          // results contains one object per select statement in the query
          results.map(({ columns, values }, i) => (
            <ResultsTable key={i} columns={columns} values={values} />
          ))
        }
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
