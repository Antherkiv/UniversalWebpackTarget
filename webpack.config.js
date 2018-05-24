/* eslint node/no-unpublished-require:0 */

const path = require('path');
const webpack = require('webpack');
const EntrySymlinkPlugin = require('./webpack/EntrySymlinkPlugin');
const MiniCssExtractPlugin = require('./webpack/MiniCssExtractPlugin');
const PluggablePlugin = require('./webpack/PluggablePlugin');
const universalTarget = require('./webpack/universalTarget');

const development = !!process.env['npm_lifecycle_script'].match(/\bdevelopment\b/);

class DummyPlugin {
  apply(compiler) {}
}

function factory(options) {
  return {
    name: options.name,
    devtool: 'source-map',
    entry: options.entry,
    output: {
      filename: development ? '[name].js' : '[name].[chunkhash].js',
      publicPath: 'libs/' + options.name + '/',
      path: path.resolve(__dirname, 'libs', options.name),
    },
    target: universalTarget(options),

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.node'],
    },

    module: {
      exprContextCritical: false,
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            // 'cache-loader',
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /\.s?[ac]ss$/,
          use: [
            development ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|eot|ttf|woff|woff2)$/,
          loader: 'url-loader',
          options: {
            limit: 10240,
          },
        },
      ],
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: development ? '[name].css' : '[name].[contenthash].[chunkhash].css',
      }),
      development ? new webpack.NamedModulesPlugin() : new webpack.HashedModuleIdsPlugin(),
      new EntrySymlinkPlugin(),
      new PluggablePlugin(
        Object.assign(
          {
            dll: options.dll,
            libsPath: path.resolve(__dirname, 'libs'),
          },
          options,
        ),
      ),
      development ? new webpack.HotModuleReplacementPlugin() : new DummyPlugin(),
    ],

    externals: [
      function(context, request, callback) {
        if (/^(webpack|mini-css-extract-plugin)\b/.test(request)) {
          return callback(null, 'commonjs ' + request);
        } else if (/^(\.\/webpack)\b/.test(request)) {
          return callback(null, 'commonjs ../' + request);
        }
        callback();
      },
      {
        'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
      },
    ],

    optimization: {
      minimize: false,
      splitChunks: {
        chunks: 'all',
      },
    },
  };
}

module.exports = [
  factory({
    name: 'Base',
    entry: {
      React: ['react'],
      ReactDom: ['react-dom'],
      Logger: ['./src/logger'],
    },
    dll: true,
  }),

  factory({
    name: 'main',
    entry: {
      main: ['./src/main'],
      other: ['./src/other'],
    },
    dll: true,
    imports: ['Base'],
  }),

  factory({
    name: 'client',
    entry: {
      client: ['./src/client'],
    },
    // withRuntime: true,
    imports: ['Base', 'main'],
  }),

  factory({
    name: 'server',
    entry: {
      server: ['./src/server'],
    },
    // withRuntime: true,
    server: true,
    imports: ['Base', 'main'],
  }),
];
