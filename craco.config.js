module.exports = {
    webpack: {
        configure:{
            // See https://github.com/webpack/webpack/issues/6725
            module:{
                rules: [{
                    test: /\.wasm$/,
                    type: 'javascript/auto',
                }]
            }
        }
        // todo https://github.com/gsoft-inc/craco/issues/104 change to docs/
        // configure: (webpackConfig, { env, paths }) => { 
        //     paths.appBuild = webpackConfig.output.path = path.resolve('custom-build-dir');
        //     return webpackConfig;  // Important: return the modified config
        // }
    }
};