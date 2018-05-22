/* eslint prettier/prettier:0 node/no-unpublished-require:0 */

const path = require('path');
const webpack = require('webpack');
const universalTarget = require('./webpack/universalTarget');

const development = !!process.env['npm_lifecycle_script'].match(/\bdevelopment\b/);

function factory(name, entry, target) {
  return {
    name: name,
    devtool: 'source-map',
    entry: entry,
    output: {
      filename: development ? '[name].js' : '[name].[chunkhash].js',
      publicPath: 'libs/' + name + '/',
      path: path.resolve(__dirname, 'libs', name),
    },
    target: target,

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json']
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
      ]
    },

    plugins: [
      development ? new webpack.NamedModulesPlugin() : new webpack.HashedModuleIdsPlugin(),
    ],

    externals: {
      'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
    },

    optimization: {
      splitChunks: {
        chunks: "all"
      }
    }
  }
}

module.exports = [

  factory(
    'Base',
    {
      'React': [
        'react',
      ],
      'ReactDom': [
        'react-dom',
      ],
      'Logger': [
        './src/logger',
      ],
    },
    universalTarget({
    })
  ),

  factory(
    'main',
    {
      'main': [
        './src/main',
      ],
      'other': [
        './src/other',
      ],
    },
    universalTarget({
      libsPath: path.resolve(__dirname, 'libs'),
      imports: [
        'Base'
      ],
    })
  ),

  factory(
    'client',
    {
      'client': [
        './src/client',
      ],
    },
    universalTarget({
      main: true,
      libsPath: path.resolve(__dirname, 'libs'),
      imports: [
        'Base',
        'main'
      ],
    })
  ),

  factory(
    'server',
    {
      'server': [
        './src/server',
      ],
    },
    universalTarget({
      main: true,
      target: 'node',
      libsPath: path.resolve(__dirname, 'libs'),
      imports: [
        'Base',
        'main'
      ],
    })
  ),

]
