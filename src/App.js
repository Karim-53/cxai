// some sql.js op https://phiresky.github.io/blog/2021/hosting-sqlite-databases-on-github-pages/
import React, { useState, useEffect } from "react";
import "./styles.css";
import initSqlJs from "sql.js"; // https://sql.js.org/#%2F=     test env https://sql.js.org/examples/GUI/index.html
import pf from 'pareto-frontier';
import DB from './database';
// Required to let webpack 4 know it needs to copy the wasm file to our assets
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

import Plot from 'react-plotly.js';
// import DataTable from 'react-data-table-component'; todo [after acceptance] https://datatables.net/

if (window.location.href.includes("localhost")) {
  console.log('localhost');
}
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

function plotly_click(data){
  
  console.log('plotly_click:')
  console.log(data)
  console.log(data.points)


  // var myPlot = document.getElementById('fig');

  // myPlot.on('plotly_click', plotly_click(data))

  let explainer = data.points[0].text
  // console.log(explainer)
  // sql = 'Select * from Explainer Where name = ' + explainer
  // result = db.exec(sql)

}
function sql_exec(sql) {
  try {
    // The sql is executed synchronously on the UI thread.
    // You may want to use a web worker here instead
    sql = `SELECT explainer, AVG(score)*100.0 AS percentage, AVG(time) AS time_per_test, count(score) AS eligible_points
    FROM cross_tab
    GROUP BY explainer;`;
    setResults(db.exec(sql)); // an array of objects is returned
    setError(null);
  } catch (err) {
    // exec throws an error when the SQL statement is invalid
    setError(err);
    setResults([]);
  }
}
/**
 * A simple SQL read-eval-print-loop
 * @param {{db: import("sql.js").Database}} props
 */
function SQLRepl({ db }) {
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);


  var df;
  // console.log(results)
  if (results.length==0) {
    df = {
        "columns": [
            "index",
            "time",
            "score",
            "eligible_points",
            "percentage",
            "eligible_tests",
            "time_per_test"
        ],
        "values": [
            [
                "baseline_random",
                1.0000317096710205,
                3.1298593441845237,
                18,
                0.173881074676918,
                12,
                0.08333597580591838
            ],
            [
                "saabas",
                0.10822415351867676,
                6.035704433917999,
                11,
                0.5487004030834545,
                6,
                0.01803735891977946
            ],
            [
                "tree_shap",
                0.08579039573669434,
                8.256456856690342,
                11,
                0.7505869869718492,
                6,
                0.014298399289449057
            ],
            [
                "archipelago",
                1.1139461994171143,
                4,
                5,
                0.8,
                5,
                0.22278923988342286
            ],
            [
                "shapley_taylor_interaction",
                9.025943517684937,
                3.2907431753151344,
                5,
                0.6581486350630269,
                5,
                1.8051887035369873
            ],
            [
                "shap_interaction",
                169.72328877449036,
                1.0155440414507773,
                5,
                0.20310880829015546,
                5,
                33.944657754898074
            ],
            [
                "anova",
                49.0090274810791,
                1.133826538897581,
                5,
                0.2267653077795162,
                5,
                9.80180549621582
            ],
            [
                "sage",
                103.58940887451172,
                5.019767485198745,
                7,
                0.7171096407426779,
                7,
                14.798486982073102
            ],
            [
                "lime",
                825.8491969108582,
                10.661781883892203,
                13,
                0.8201370679917079,
                7,
                117.97845670155117
            ],
            [
                "kernel_shap",
                50.426323652267456,
                10.133078100329183,
                11,
                0.9211889182117439,
                6,
                8.404387275377909
            ],
            [
                "maple",
                966.3937382698059,
                9.22704081632653,
                13,
                0.7097723704866562,
                7,
                138.05624832425798
            ]
        ]
    };
  } else {
    // console.log(results[0]);
    df = results[0];
  }
  // var time_per_test = [1, 2, 3, 4, 5]
  // var percentage = [1, 6, 3, 6, 1]
  // var eligible_points = [1, 2, 10, 6, 1]
  // var text = ['Dummy-data', 'A-2', 'A-3', 'A-4', 'A-5']
  // var pareto_time_per_test = [1.5, 2.5, 3.5, 4.5, 5.5]
  // var pareto_percentage = [4, 1, 7, 1, 4]

  // if (results.length> 0) {
  var column = to_dict(df.columns)
  var time_per_test = arrayColumn(df.values, column['time_per_test']);
  var percentage = arrayColumn(df.values, column['percentage']);
  var eligible_points = arrayColumn(df.values, column['eligible_points']);
  var text = arrayColumn(df.values, column['index']);


  var merged = []
  for (let i = 0; i < time_per_test.length; i++) {
    merged.push([percentage[i], time_per_test[i]]);
  }
  const pareto = pf.getParetoFrontier(merged, { optimize: 'bottomRight' });

  var pareto_time_per_test = arrayColumn(pareto, 1);
  var pareto_percentage = arrayColumn(pareto, 0);

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
      
      <h1>Click on an explainer for more details</h1>
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





  // SELECT *
  // FROM cross_tab

  // explainer, category, AVG(score), COUNT(score)
  // GROUP BY category


  SELECT explainer, category, AVG(time), AVG(score)
FROM cross_tab
Left JOIN test ON cross_tab.test = test.test
Where explainer = 'archipelago'
GROUP BY category


SELECT explainer, category, AVG(time), AVG(score)
FROM cross_tab
Left JOIN test ON cross_tab.test = test.test
Where explainer = 'baseline_random'
GROUP BY category