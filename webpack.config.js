const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: "./app.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, 'dist')
    },
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"]
    },
    module: {
        rules: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { 
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            // All files with a '.ts' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.ts$/, 
                loader: "awesome-typescript-loader"
            }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: "./*.html" }
        ])
    ]
};