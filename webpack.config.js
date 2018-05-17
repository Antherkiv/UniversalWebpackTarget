/* eslint prettier/prettier:0 */

const path = require('path');

const webpack = require('webpack');
const universalTarget = require('./universal-webpack');

function factory(name, entry, target) {
  return {
    name: name,
    devtool: 'source-map',
    entry: entry,
    output: {
      filename: '[name].js',
      // filename: '[name].[chunkhash].js',
      publicPath: 'libs/' + name + '/',
      path: path.resolve(__dirname, 'libs', name),
    },
    target: target,

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json']
    },

    module: {
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
      new webpack.NamedModulesPlugin(),
      // new webpack.NamedChunksPlugin(),
    ],

    externals: {
      'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
    },
  }
}

module.exports = [

  factory(
    'Base',
    {
      'Base': [
        'react',
        'react-dom',
      ],
      'Logger': [
        './src/logger',
      ],
    },
    universalTarget({
      dll: true,
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
      dll: true,
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
      target: 'node',
      libsPath: path.resolve(__dirname, 'libs'),
      imports: [
        'Base',
        'main'
      ],
    })
  ),

]
