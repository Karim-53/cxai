<h1 align="center">Compare-xAI · Interactive Benchmark 🌐</h1>

<p align="center">
  <b>The web front-end for <a href="https://github.com/Karim-53/Compare-xAI">Compare-xAI</a> — explore, sort, and filter Explainable-AI benchmark results right in your browser.</b>
</p>

<p align="center">
  <a href="https://karim-53.github.io/cxai/"><img alt="Live" src="https://img.shields.io/badge/live-demo-brightgreen"></a>
  <img alt="React" src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB">
  <img alt="sql.js" src="https://img.shields.io/badge/sql.js-WASM-003B57?logo=sqlite&logoColor=white">
</p>

**➡️ Live app: [karim-53.github.io/cxai](https://karim-53.github.io/cxai/)**

This is a single-page [React](https://reactjs.org/) application that ships the entire Compare-xAI benchmark database as a WebAssembly SQLite file and queries it **client-side** with [sql.js](https://github.com/sql-js/sql.js) — no backend, no server round-trips. Users can rank explainability methods by comprehensibility, portability, and runtime, and drill into individual test results.

## 🛠️ Tech highlights
- ⚛️ **React SPA** — served statically via GitHub Pages.
- 🗄️ **In-browser SQL** — the benchmark ships as a SQLite DB read directly in the browser with sql.js (WASM).
- 🧩 **Custom webpack via [craco](https://github.com/gsoft-inc/craco)** — see [`craco.config.js`](./craco.config.js), which copies the sql.js WASM module into the build assets. The application logic lives in [`src/App.js`](./src/App.js).

## 🚀 Run it locally
Requires Node.js 16.

```bash
npm install
npm start        # dev server at http://localhost:3000
npm run build    # production build
```

## 🔗 Related
- **[Compare-xAI](https://github.com/Karim-53/Compare-xAI)** — the benchmark itself, the experiments, and the paper (arXiv:2207.14160).

_Reference: the sql.js + React integration follows the [react-sqljs-demo](https://github.com/sql-js/react-sqljs-demo)._
