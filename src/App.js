// some sql.js op https://phiresky.github.io/blog/2021/hosting-sqlite-databases-on-github-pages/
import React, { useState, useEffect } from "react";
import "./styles.css";
import initSqlJs from "sql.js"; // https://sql.js.org/#%2F=     test env https://sql.js.org/examples/GUI/index.html
import pf from 'pareto-frontier';
import DB from './database';
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm"; // Required to let webpack 4 know it needs to copy the wasm file to our assets
import Plot from 'react-plotly.js';
// import DataTable from 'react-data-table-component'; todo [after acceptance] https://datatables.net/
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
const average_score = (arr, dico) => arr.map(x => average([x[dico['percentage_fidelity']],x[dico['percentage_stability']]]));

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
/**
 * A simple SQL read-eval-print-loop
 * @param {{db: import("sql.js").Database}} props
 */
function SQLRepl({ db }) {
  const sql = `SELECT	explainer,
                    AVG(time) AS time_per_test,
                    count(score) AS eligible_points,
                    AVG(case category when 'fidelity' then score end)*100.0 AS percentage_fidelity,
                    AVG(case category when 'stability' then score end)*100.0 AS percentage_stability
            FROM cross_tab
            Left JOIN test ON cross_tab.test = test.test
            GROUP BY explainer;`;
  const [error, setError] = useState(null);
  const [results, setResults] = useState(db.exec(sql));

  function sql_exec(sql_bof) {
    try {
      // The sql is executed synchronously on the UI thread. You may want to use a web worker here instead
      setResults(db.exec(sql)); // an array of objects is returned
      setError(null);
    } catch (err) {
      // exec throws an error when the SQL statement is invalid
      setError(err);
      setResults([]);
    }
  }

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


//   SELECT explainer, category, AVG(time), AVG(score)
// FROM cross_tab
// Left JOIN test ON cross_tab.test = test.test
// Where explainer = 'archipelago'
// GROUP BY category


// SELECT explainer, category, AVG(time), AVG(score)
// FROM cross_tab
// Left JOIN test ON cross_tab.test = test.test
// Where explainer = 'baseline_random'
// GROUP BY category


// SELECT	explainer,
// 		AVG(time) AS time_per_test,
//  		count(score) AS eligible_points,
// 		AVG(case category when 'fidelity' then score end) AS score_fidelity,
// 		AVG(case category when 'stability' then score end) AS score_stability
// FROM cross_tab
// Left JOIN test ON cross_tab.test = test.test
// GROUP BY explainer


// (IFNULL(score_fidelity, 0.0)+IFNULL(score_stability, 0.0))/