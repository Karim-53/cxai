# Install (no admin)
from https://gkarthiks.medium.com/how-to-install-nodejs-and-npm-in-non-admin-access-windows-machines-102fd461b54c
download `https://nodejs.org/dist/v16.16.0/win-x64/node.exe`, put it in a fixed place.
Add to PATH Windows key, edit variable environment for your account


download `https://registry.npmjs.org/npm/-/npm-8.11.0.tgz`
In a new cmd:
```
cd C:\Inn\Programme\root\package
node bin/npm-cli.js install npm -gf

```

to verify installation
node v16.16.0
npm 8.15.0
```
node -v
npm -v
```

# Init
```
cd cxai/
npm i
npm i @craco/craco
npm start
```
or
```
npm run build
```

# Side notes

see https://github.com/sql-js/react-sqljs-demo/issues/9


#demonstration of [react](https://reactjs.org/) + [sql.js](https://github.com/sql-js/sql.js)


The only differences with a traditional create-react-app application are :
 - The usage of [craco](https://github.com/gsoft-inc/craco) to allow providing a custom [webpack](https://webpack.js.org/) configuration
 - a small custom webpack configuration in [`craco.config.js`](./craco.config.js) to copy the wasm module from sql.js to the distributed assets

 See [`src/App.js`](./src/App.js) for the code.
