/*
 * @Author: LogIN-
 * @Date:   2019-01-22 11:52:45
 * @Last Modified by:   LogIN-
 * @Last Modified time: 2019-02-02 17:17:19
 */
/*
 * @Author: LogIN-
 * @Date:   2019-01-18 08:41:04
 * @Last Modified by:   LogIN-
 * @Last Modified time: 2019-01-22 11:52:45
 */
"use strict";
const path = require("path");
const fs = require('fs');

const webpack = require("webpack");

const nodeExternals = require("webpack-node-externals");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const CompressionWebpackPlugin = require("compression-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const argv = require("minimist")(process.argv.slice(2));
const isWeb = argv && argv.target === "web";

const output = isWeb ? "compiled/web" : "compiled/electron";

const _ = require("./utils");

const OUTPUT_DIR = path.resolve(__dirname, "../" + output);
const SRC_DIR = path.resolve(__dirname, "../src");

const packageInfo = require(path.resolve(__dirname, `../package.json`));

const prepareMessagesPlugin = require(path.resolve(__dirname, `../src/app/translations/scripts/prepareMessagesPlugin.js`));

module.exports = enviroment => {
    // Copy configuration template and try to set initial env variables
    const envTemplateExample = path.resolve(__dirname, `../config/env_${enviroment}.example.json`);
    const envTemplateFinal = path.join(__dirname, `../config/env_${enviroment}.json`);

    if (!fs.existsSync(envTemplateFinal)) {
        if(argv){
            let envTemplate = require(envTemplateExample);
            if(typeof argv.server_frontend !== "undefined"){
                envTemplate.server.frontend = argv.server_frontend;
            }
            if(typeof argv.server_backend !== "undefined"){
                envTemplate.server.backend = argv.server_backend;
            }
            if(typeof argv.server_homepage !== "undefined"){
                envTemplate.server.homepage = argv.server_homepage;
            }
            if(typeof argv.api_secret !== "undefined"){
                envTemplate.api.secret = argv.api_secret;
            }
            if(typeof argv.api_chargebee_site_name !== "undefined"){
                envTemplate.api.chargebee_site_name = argv.api_chargebee_site_name;
            }
            if(typeof argv.api_chargebee !== "undefined"){
                envTemplate.api.chargebee = argv.api_chargebee;
            }
            envTemplate = JSON.stringify(envTemplate,null,2);  
            fs.writeFileSync(envTemplateFinal, envTemplate)
            // yarn run start:web --server_frontend=xyc --server_backend=xyc --server_homepage=xyc --api_secret=xyc --api_chargebee_site_name=xyc --api_chargebee=xyc
        }     
    }

    const config = {
        resolve: {
            extensions: [".js", ".vue", ".css", ".json", ".scss", ".eot", ".ttf", ".woff", ".woff2", ".svg"],
            alias: {
                env_vars$: path.resolve(__dirname, `../config/env_${enviroment}.json`),
                scss_vars: SRC_DIR + "/app/styles/variables.scss",
                "@": SRC_DIR + "/app"
            },
            modules: [
                // places where to search for required modules
                _.cwd("node_modules"),
                _.cwd("src")
            ]
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    loaders: ["style-loader", "css-loader", "resolve-url-loader"]
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: "style-loader"
                        },
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: false
                            }
                        },
                        {
                            loader: "resolve-url-loader",
                            options: {
                                debug: false
                            }
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: true
                            }
                        }
                    ]
                },
                {
                    test: /\.vue$/,
                    loader: "vue-loader",
                    options: {
                        hotReload: false,
                        extractCSS: enviroment === "production",
                        cssSourceMap: true,
                        loaders: {
                            scss: ["vue-style-loader", "css-loader", "resolve-url-loader", "sass-loader"],
                            sass: ["vue-style-loader", "css-loader", "resolve-url-loader", "sass-loader?indentedSyntax"]
                        },
                        transformToRequire: {
                            video: ["src", "poster"],
                            source: "src",
                            img: "src",
                            image: "xlink:href"
                        }
                    }
                },
                {
                    test: /\.(js|jsx)$/,
                    loader: "babel-loader",
                    include: [SRC_DIR, path.join(__dirname, "..", "node_modules/webpack-dev-server/client")]
                    //exclude: /node_modules/,
                },
                {
                    test: /\.(png|jpe?g|gif)(\?.*)?$/,
                    loader: "url-loader",
                    options: {
                        limit: 10000,
                        name: "images/[name].[hash:7].[ext]"
                    }
                },
                {
                    test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                    loader: "url-loader",
                    options: {
                        limit: 10000,
                        name: "media/[name].[hash:7].[ext]"
                    }
                },
                {
                    test: /\.(woff2?|woff|eot|ttf|otf|svg)(\?.*)?$/,
                    loader: "url-loader",
                    options: {
                        limit: 10000,
                        name: "fonts/[name].[hash:7].[ext]"
                    }
                }
            ]
        },
        plugins: [
            new VueLoaderPlugin(),
            new webpack.DefinePlugin({
                "process.env": {
                    ENV: '"' + enviroment + '"',
                    VERSION: JSON.stringify(packageInfo.version),
                    REPOSITORY: JSON.stringify(packageInfo.repository),
                    HOMEPAGE: JSON.stringify(packageInfo.homepage),
                    COPYRIGHT: JSON.stringify(packageInfo.copyright)
                }
            }),
            new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
            new CleanWebpackPlugin([output], {
                root: SRC_DIR + "/../",
                verbose: true,
                dry: false
            }),
            new webpack.optimize.OccurrenceOrderPlugin(),
            new webpack.NoEmitOnErrorsPlugin(),
            new FriendlyErrorsWebpackPlugin({
                clearConsole: enviroment === "development"
            }),
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: enviroment == "development" ? "[name].css" : "[name].[hash].css",
                chunkFilename: enviroment == "development" ? "[id].css" : "[id].[hash].css"
            }),
            // Prepare translations files
            new prepareMessagesPlugin(),
            new HtmlWebpackPlugin({
                title: "SIMON",
                template: SRC_DIR + "/index.html",
                minify: {
                    collapseWhitespace: true,
                    removeAttributeQuotes: false,
                    removeComments: true,
                    caseSensitive: true
                },
                filename: "index.html",
                inject: "body",
                cache: "false",
                chunks: ["main", "vendor"],
                excludeChunks: ["background"],
                chunksSortMode: "none"
            }),
            // https://stackoverflow.com/questions/34827956/webpack-gzip-compressed-bundle-not-being-served-the-uncompressed-bundle-is
            new CompressionWebpackPlugin({
                asset: "[path].gz[query]",
                algorithm: "gzip",
                test: new RegExp("\\.(js|css)$"),
                threshold: 10240,
                minRatio: 0.8
            }),
            new CopyWebpackPlugin(
                [
                    {
                        from: SRC_DIR + "/../static",
                        to: SRC_DIR + "/../" + output + "/static"
                    },
                    {
                        from: SRC_DIR + "/humans.txt",
                        to: SRC_DIR + "/../" + output + "/humans.txt"
                    },
                    {
                        from: SRC_DIR + "/robots.txt",
                        to: SRC_DIR + "/../" + output + "/robots.txt"
                    }
                ],
                { ignore: [".*"] }
            )
        ],
        stats: {
            colors: true,
            children: false,
            chunks: false,
            modules: false,
            reasons: true,
            errorDetails: true
        }
    };
    if (isWeb === false) {
        config.target = "electron-renderer";
        config.node = {
            setImmediate: false,
            __dirname: false,
            __filename: false
        };
        config.externals = [
            nodeExternals({
                whitelist: [
                    // "axios",
                    // "babel-polyfill",
                    // "clipboard",
                    // "echarts",
                    // "element-ui",
                    // "file-saver",
                    // "font-awesome",
                    // "gzip-js",
                    // "handsontable",
                    // "is-url",
                    // "jspdf",
                    // "lib-r-math.js",
                    // "lodash",f
                    // "material-design-icons",
                    // "moment",
                    // "normalize.css",
                    // "nprogress",
                    // "store",
                    // "tsne-js",
                    // "uuid",
                    // "vue",
                    // "vue-count-to",
                    // "vue-electron",
                    // "vue-form-wizard",
                    // "vue-i18n",
                    // "vue-introjs",
                    // "vue-router",
                    // "vuedraggable",
                    // "vuex",
                    // "whatwg-fetch",
                    // "xlsx",
                    "webpack/hot/poll?1000",
                    "webpack/hot/dev-server",
                    "webpack/hot/signal.js"
                ]
            })
        ];
    } else {
        config.target = "web";
        config.optimization = {
            runtimeChunk: {
                name: "vendor"
            },
            splitChunks: {
                cacheGroups: {
                    default: false,
                    commons: {
                        test: /node_modules/,
                        name: "vendor",
                        chunks: "initial",
                        minSize: 1
                    }
                }
            }
        };

        config.node = {
            // prevent webpack from injecting useless setImmediate polyfill because Vue
            // source contains it (although only uses it if it's native).
            setImmediate: false,
            // prevent webpack from injecting mocks to Node native modules
            // that does not make sense for the client
            dgram: "empty",
            fs: "empty",
            net: "empty",
            tls: "empty",
            child_process: "empty"
        };
    }

    if (enviroment == "development") {
        config.devtool = "source-map";
        config.devServer = {
            historyApiFallback: true,
            noInfo: false,
            clientLogLevel: "warning",
            https: true,
            hot: false,
            contentBase: path.join(__dirname, output),
            inline: false,
            port: 8080,
            quiet: true,
            disableHostCheck: true,
            watchOptions: {
                poll: false
            },
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
            }
        };
        if (isWeb === true) {
            // config.plugins.push(new BundleAnalyzerPlugin());
            config.plugins.push(new webpack.HotModuleReplacementPlugin({ quiet: true }));
        }
    } else {
        config.optimization.minimize = true;
        config.optimization.minimizer = [
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                extractComments: true,
                sourceMap: true,
                uglifyOptions: {
                    output: {
                        comments: false
                    },
                    ecma: 8,
                    warnings: false
                }
            })
        ];
    }
    return config;
};
