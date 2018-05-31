/* eslint node/no-unpublished-require:0 */

const path = require('path');
const webpack = require('webpack');
const pluggable = require('webpack-pluggable');
const WebpackVisualizerPlugin = require('webpack-visualizer-plugin');
const AssetsWebpackPlugin = require('assets-webpack-plugin');

const development =
  process.env.NODE_ENV === 'development' ||
  /\bdevelopment\b/.test(process.env['npm_lifecycle_script'] || '');

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
      publicPath: '/libs/' + options.name + '/',
      path: path.resolve(__dirname, 'libs', options.name),
    },
    target: pluggable.target(options),

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.node'],
    },

    module: {
      exprContextCritical: false,
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            'cache-loader',
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /\.s?[ac]ss$/,
          use: [
            development ? 'style-loader' : pluggable.MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(ico|png|jpg|jpeg|gif|svg|eot|ttf|woff|woff2)$/,
          loader: 'url-loader',
          options: {
            limit: 10240,
          },
        },
      ],
    },

    plugins: [
      new pluggable.MiniCssExtractPlugin({
        filename: development ? '[name].css' : '[name].[contenthash].[chunkhash].css',
      }),
      development ? new webpack.NamedModulesPlugin() : new webpack.HashedModuleIdsPlugin(),
      new pluggable.EntrySymlinkPlugin(),
      new pluggable.PluggablePlugin(
        Object.assign(
          {
            dll: options.dll,
            libsPath: path.resolve(__dirname, 'libs'),
          },
          options,
        ),
      ),
      development ? new webpack.HotModuleReplacementPlugin() : new DummyPlugin(),
      new AssetsWebpackPlugin({
        path: path.resolve(__dirname, 'libs', options.name),
        filename: 'manifest.json',
        fullPath: false,
        update: true,
        prettyPrint: true,
        metadata: {
          build: new Date()
            .toISOString()
            .replace(/[-.:T]/g, '')
            .substring(0, 14),
        },
      }),
      !development
        ? new WebpackVisualizerPlugin({
            filename: 'webpack-visualizer.html',
          })
        : new DummyPlugin(),
    ],

    externals: [
      function(context, request, callback) {
        if (/^(webpack|domains.json)\b/.test(request)) {
          if (!/^webpack-hot-middleware\/client\b/.test(request)) {
            return callback(null, 'commonjs ' + request);
          }
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

module.exports = {
  DummyPlugin,
  development,
  factory,
};
