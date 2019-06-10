const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: "./app.ts",
    output: {
        filename: "bundle.[contenthash].js",
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
            },
            // {
            //     test: /\.css$/,
            //     use: ['style-loader', 'css-loader'],
            // },
            {
                test: /\.(scss)$/,
                use: [
                    {
                        loader: 'style-loader', // inject CSS to page
                    }, 
                    {
                        loader: 'css-loader', // translates CSS into CommonJS modules
                    }, 
                    {
                        loader: 'postcss-loader', // Run postcss actions
                        options: {
                            plugins: function() { // postcss plugins, can be exported to postcss.config.js
                                return [
                                    require('autoprefixer')
                                ];
                            }
                        }
                    }, 
                    {
                        loader: 'sass-loader' // compiles Sass to CSS
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        }),
        new CopyWebpackPlugin([
            {
                from: 'images',
                to: 'images'
            } 
        ]), 
    ]
};