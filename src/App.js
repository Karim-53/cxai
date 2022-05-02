// some sql.js op https://phiresky.github.io/blog/2021/hosting-sqlite-databases-on-github-pages/
import React, { useState, useEffect } from "react";
import "./styles.css";
import initSqlJs from "sql.js"; // https://sql.js.org/#%2F=     test env https://sql.js.org/examples/GUI/index.html
import pf from 'pareto-frontier';
import DB from './database';
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm"; // Required to let webpack 4 know it needs to copy the wasm file to our assets
import Plot from 'react-plotly.js';
import CheckboxTree from 'react-checkbox-tree';
import "react-checkbox-tree/lib/react-checkbox-tree.css";
// import DataTable from 'react-data-table-component'; todo [after acceptance] https://datatables.net/
const nodes = [
{
  value: 'supported_models_checklist',
  label: 'I need to explain specific AI model(s):',
  children: [
      { value: 'model_agnostic', label: 'model_agnostic' },
      { value: 'tree_based', label: 'tree_based' },
      { value: 'neural_network', label: 'neural_network' },
  ],
},
{
  value: 'required_output_checklist',
  label: 'I need specific output(s) from the XAI:',
  children: [
      { value: 'importance', label: 'Feature importance (Global Explanation)' },
      { value: 'attribution', label: 'Feature attribution (Local Explanation)' }, //  # We discuss the attribution problem, i.e., the problem of distributing the prediction score of a model for a specific input to its base features (cf. [15, 10, 19]); the attribution to a base feature can be interpreted as the importance of the feature to the prediction. https://arxiv.org/pdf/1908.08474.pdf
      { value: 'interaction', label: 'Pair feature interaction (Global Explanation)' },
      // # Definition 1 (Statistical Non-Additive Interaction). A function f contains a statistical non-additive interaction of multiple features indexed in set I if and only if f cannot be decomposed into a sum of |I| subfunctions fi , each excluding the i-th interaction variable: f(x) =/= Sum i∈I fi(x\{i}).
      // #  Def. 1 identifies a non-additive effect among all features I on the output of function f (Friedman and Popescu, 2008; Sorokina et al., 2008; Tsang et al., 2018a). see https://arxiv.org/pdf/2103.03103.pdf
      // # todo [after acceptance] we need a page with a clear description of each option
      { value: 'todo1', label: 'Future work: Pair interaction (Local Ex), multi F interaction, NLP, debugging ...' }
  ]
},
{
  value: 'required_input_data_',
  label: 'I can provide some information to the xAI algorithm:',
  children: [
      { value: 'required_input_data_reference_df', label: 'A reference input data' },
      { value: 'required_input_data_truth', label: 'Target values of the data points to explain (truth, not prediction)' }, //  # We discuss the attribution problem, i.e., the problem of distributing the prediction score of a model for a specific input to its base features (cf. [15, 10, 19]); the attribution to a base feature can be interpreted as the importance of the feature to the prediction. https://arxiv.org/pdf/1908.08474.pdf
  ]
},
{
  value: 'explainer_input_xai_',
  label: 'I can execute additional operation on the AI model:',
  children: [
      { value: 'explainer_input_xai_train_function', label: 'Retrain the model.' },
      { value: 'explainer_input_xai_predict_function', label: 'Perform addional predictions.' }, //  # We discuss the attribution problem, i.e., the problem of distributing the prediction score of a model for a specific input to its base features (cf. [15, 10, 19]); the attribution to a base feature can be interpreted as the importance of the feature to the prediction. https://arxiv.org/pdf/1908.08474.pdf
  ]
},
{
  value: 'test_adversarial_attacks',
  label: 'I trust the xAI output (I created the data and the model myself)'
},
{
  value: 'assumptions_data_distribution_iid',
  label: 'Assume input features to be independent and uniformly distributed'
},
{
  value: 'explainer_need_gpu',
  label: 'Constraint on hardware equipement: xAI alg. require a GPU.'
}
// {
//   value: 'uid',
//   label: 'visible'
// },
// {
//   value: 'uid',
//   label: 'visible'
// },
// {
//   value: 'uid',
//   label: 'visible'
// }
];


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
const pecentage_per_category = categories.map(category => ' AVG(case category when '+category+' then score end)*100.0 AS percentage_'+category).join(',\n ');

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

function sql(explainer){

  return `SELECT	explainer,
AVG(time) AS time_per_test,
count(score) AS eligible_points,
` + pecentage_per_category + ` 
FROM cross_tab
Left JOIN test ON cross_tab.test = test.test
GROUP BY explainer;

SELECT	category AS test_category, test.test, subtest, ROUND(score,2), ROUND(time),
test.description AS test_description
FROM cross_tab
Left JOIN test ON cross_tab.test = test.test
Where (explainer = '`+explainer+`') and (score IS NOT NULL)
Order By test_category, test_subtest;
`;
}
/**
 * A simple SQL read-eval-print-loop
 * @param {{db: import("sql.js").Database}} props
 */
function SQLRepl({ db }) {
  const [error, setError] = useState(null);
  const [selected_explainer, setExplainer] = useState('kernel_shap');
  const [results, setResults] = useState(db.exec(sql(selected_explainer)));
  const [checked, setChecked] = useState([]);
  const [expanded, setExpanded] = useState([]);
  
  console.log('checked', checked)
  function sql_exec(sql_bof) {
    try {
      // The sql is executed synchronously on the UI thread. You may want to use a web worker here instead
      setResults(db.exec(sql(selected_explainer))); // an array of objects is returned
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
  }
  console.log('passed explainer', selected_explainer)
  console.log(results)
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

    title:"Global overview of the explainers' performance"
  };  // todo [after acceptance] autosize: true, https://dev.to/dheerajmurali/building-a-responsive-chart-in-react-with-plotly-js-4on8

  // Plotly.newPlot('myDiv', data, layout);




  return (
    <div className="App">
      <Plot
        data={data}
        layout={layout}
        onClick={plotly_click}
        divId={'fig'}
      />
      <h1>Filters</h1> 
      <pre>
        <CheckboxTree
            nodes={nodes}
            checked={checked}
            expanded={expanded}
            onCheck={checked => {setChecked(checked)}}
            onExpand={expanded => setExpanded(expanded)}
            showExpandAll={true}
        />
      </pre>
      {/* on hover help https://reactjs.org/docs/events.html */}

      <h1 id='explainer_title' >Click on an explainer for more details</h1>

      <textarea
        onChange={(e) => sql_exec(e.target.value)}
        placeholder="Enter some SQL. No inspiration ? Try “select sqlite_version()”"
      ></textarea>

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
