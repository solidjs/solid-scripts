const fs = require("fs");
const isWsl = require("is-wsl");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const WatchMissingNodeModulesPlugin = require("react-dev-utils/WatchMissingNodeModulesPlugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const safePostCssParser = require("postcss-safe-parser");

const getClientEnvironment = require("./env");
const paths = require("./paths");

const useTypeScript = fs.existsSync(paths.appTsConfig);

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP === "true";

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

module.exports = webpackEnv => {
  const isProduction = webpackEnv === "production",
    isDevelopment = webpackEnv === "development";

  const publicPath = isProduction ? paths.servedPath : isDevelopment && "/";

  const shouldUseRelativeAssetPaths = publicPath === "./";

  const publicUrl = isProduction ? publicPath.slice(0, -1) : isDevelopment && "";

  const browsersList = paths.browserslist;

  // Get environment variables to inject into our app.
  const env = getClientEnvironment(publicUrl);

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor, isElement) => {
    const loaders = [
      isElement && require.resolve("to-string-loader"),
      !isElement && isDevelopment && require.resolve("style-loader"),
      !isElement &&
        isProduction && {
          loader: ExtractCssChunks.loader,
          options: shouldUseRelativeAssetPaths ? { publicPath: "../../" } : {}
        },
      {
        loader: require.resolve("css-loader"),
        options: cssOptions
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve("postcss-loader"),
        options: {
          postcssOptions: {
            // Necessary for external CSS imports to work
            // https://github.com/facebook/create-react-app/issues/2677
            ident: "postcss",
            plugins: [
              require("postcss-flexbugs-fixes"),
              require("postcss-preset-env")({
                autoprefixer: {
                  flexbox: "no-2009"
                },
                stage: 3
              }),
              // Adds PostCSS Normalize as the reset css with default options,
              // so that it honors browserslist config in package.json
              // which in turn let's users customize the target behavior as per their needs.
              postcssNormalize()
            ]
          },
          sourceMap: isProduction ? shouldUseSourceMap : isDevelopment
        }
      }
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push({
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: isProduction ? shouldUseSourceMap : isDevelopment
        }
      });
    }
    return loaders;
  };

  return {
    mode: webpackEnv,
    bail: isProduction,
    devtool: isProduction
      ? shouldUseSourceMap
        ? "source-map"
        : false
      : isDevelopment && "cheap-module-source-map",
    entry: paths.appIndexJs,
    output: {
      path: isProduction ? paths.appBuild : undefined,
      pathinfo: isDevelopment,
      filename: isProduction
        ? "static/js/[name].[contenthash:8].js"
        : isDevelopment && "static/js/bundle.js",
      // TODO: remove this when upgrading to webpack 5
      futureEmitAssets: true,
      chunkFilename: isProduction
        ? "static/js/[name].[contenthash:8].chunk.js"
        : isDevelopment && "static/js/[name].chunk.js",
      // We inferred the "public path" (such as / or /my-project) from homepage.
      // We use "/" in development.
      publicPath: publicPath
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8
            },
            compress: {
              ecma: 6,
              warnings: false,
              comparisons: false,
              inline: 2
            },
            mangle: {
              safari10: true
            },
            output: {
              ecma: 6,
              comments: false,
              ascii_only: true
            }
          },
          // Disabled on WSL (Windows Subsystem for Linux) due to an issue with Terser
          // https://github.com/webpack-contrib/terser-webpack-plugin/issues/21
          parallel: !isWsl,
          cache: true,
          sourceMap: shouldUseSourceMap
        }),
        // This is only used in production mode
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: false
          }
        })
      ],
      splitChunks: {
        chunks: "all",
        name: false
      },
      runtimeChunk: true
    },
    resolve: {
      modules: ["node_modules", paths.appNodeModules],
      extensions: paths.moduleFileExtensions
        .map(ext => `.${ext}`)
        .filter(ext => useTypeScript || !ext.includes("ts")),
      alias: {
        "solid-js$": isProduction ? "solid-js" : "solid-js/dist/dev.js",
        "solid-js/web$": isProduction ? "solid-js/web" : "solid-js/web/dist/dev.js",
        "solid-js/store$": isProduction ? "solid-js/store" : "solid-js/store/dist/dev.js"
      }
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve("url-loader"),
              options: {
                limit: 10000,
                name: "static/media/[name].[hash:8].[ext]"
              }
            },
            {
              test: /\.(ts|tsx)$/,
              include: paths.appElements,
              use: [
                require.resolve("component-register-loader"),
                {
                  loader: require.resolve("babel-loader"),
                  options: {
                    babelrc: false,
                    configFile: false,
                    presets: [
                      ["@babel/preset-env", { targets: browsersList }],
                      "solid",
                      "@babel/preset-typescript"
                    ],
                    plugins: [
                      "@babel/plugin-syntax-dynamic-import",
                      "@babel/proposal-class-properties",
                      "@babel/proposal-object-rest-spread"
                    ],
                    cacheDirectory: true,
                    cacheCompression: isProduction,
                    compact: isProduction
                  }
                }
              ]
            },
            {
              test: /\.(ts|tsx)$/,
              include: paths.appSrc,
              exclude: [paths.appElements],
              use: [
                {
                  loader: require.resolve("babel-loader"),
                  options: {
                    babelrc: false,
                    configFile: false,
                    presets: ["@babel/preset-env", "solid", "@babel/preset-typescript"],
                    plugins: [
                      "@babel/plugin-syntax-dynamic-import",
                      "@babel/proposal-class-properties",
                      "@babel/proposal-object-rest-spread"
                    ],
                    cacheDirectory: true,
                    cacheCompression: isProduction,
                    compact: isProduction
                  }
                }
              ]
            },
            {
              test: /\.(js|mjs|jsx)$/,
              include: paths.appElements,
              use: [
                require.resolve("component-register-loader"),
                {
                  loader: require.resolve("babel-loader"),
                  options: {
                    babelrc: false,
                    configFile: false,
                    presets: [["@babel/preset-env", { targets: browsersList }], "solid"],
                    plugins: ["@babel/plugin-syntax-dynamic-import"],
                    cacheDirectory: true,
                    cacheCompression: isProduction,
                    compact: isProduction
                  }
                }
              ]
            },
            {
              test: /\.(js|mjs|jsx)$/,
              include: paths.appSrc,
              exclude: [paths.appElements],
              use: [
                {
                  loader: require.resolve("babel-loader"),
                  options: {
                    babelrc: false,
                    configFile: false,
                    presets: [["@babel/preset-env", { targets: browsersList }], "solid"],
                    plugins: ["@babel/plugin-syntax-dynamic-import"],
                    cacheDirectory: true,
                    cacheCompression: isProduction,
                    compact: isProduction
                  }
                }
              ]
            },
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [["@babel/preset-env", { targets: browsersList }]],
                cacheDirectory: true,
                cacheCompression: isProduction,
                sourceMaps: isProduction ? shouldUseSourceMap : isDevelopment,
                inputSourceMap: isProduction ? shouldUseSourceMap : isDevelopment
              }
            },
            // Custom Element CSS
            {
              test: cssRegex,
              include: paths.appElements,
              exclude: cssModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 1,
                  sourceMap: isProduction ? shouldUseSourceMap : isDevelopment
                },
                undefined,
                true
              )
            },
            {
              test: sassRegex,
              include: paths.appElements,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isProduction ? shouldUseSourceMap : isDevelopment
                },
                "sass-loader",
                true
              )
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use ExtractCssChunks to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isProduction ? shouldUseSourceMap : isDevelopment
              }),
              sideEffects: true
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isProduction ? shouldUseSourceMap : isDevelopment,
                modules: true,
                getLocalIdent: getCSSModuleLocalIdent
              })
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isProduction ? shouldUseSourceMap : isDevelopment
                },
                "sass-loader"
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isProduction ? shouldUseSourceMap : isDevelopment,
                  modules: true,
                  getLocalIdent: getCSSModuleLocalIdent
                },
                "sass-loader"
              )
            },
            {
              loader: require.resolve("file-loader"),
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: "static/media/[name].[hash:8].[ext]"
              }
            }
          ]
        }
      ]
    },
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml
          },
          isProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true
                }
              }
            : undefined
        )
      ),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      new webpack.DefinePlugin(env.stringified),
      // This is necessary to emit hot updates (currently CSS and WebComponents only):
      isDevelopment && new webpack.HotModuleReplacementPlugin(),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isDevelopment && new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      isDevelopment && new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isProduction &&
        new ExtractCssChunks({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "static/css/[name].[contenthash:8].css",
          chunkFilename: "static/css/[name].[contenthash:8].chunk.css"
        }),
      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so that tools can pick it up without
      // having to parse `index.html`.
      new ManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: publicPath,
        generate: (seed, files) => {
          const manifestFiles = files.reduce(function (manifest, file) {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);

          return {
            files: manifestFiles
          };
        }
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code.
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the Webpack build.
      isProduction &&
        new WorkboxWebpackPlugin.GenerateSW({
          clientsClaim: true,
          exclude: [/\.map$/, /asset-manifest\.json$/],
          importWorkboxFrom: "cdn",
          navigateFallback: publicUrl + "/index.html",
          navigateFallbackBlacklist: [
            // Exclude URLs starting with /_, as they're likely an API call
            new RegExp("^/_"),
            // Exclude URLs containing a dot, as they're likely a resource in
            // public/ and not a SPA route
            new RegExp("/[^/]+\\.[^/]+$")
          ]
        })
    ].filter(Boolean),
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      module: "empty",
      dgram: "empty",
      dns: "mock",
      fs: "empty",
      http2: "empty",
      net: "empty",
      tls: "empty",
      child_process: "empty"
    },
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false
  };
};
