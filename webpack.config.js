const path = require('path');

const webpack = require('webpack');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const universalTarget = require('./universal-webpack');

module.exports = [
  {
    name: 'Base',
    entry: {
      'Base': [
        'react',
        'react-dom',
      ]
    },
    output: {
      library: 'Base',
      filename: '[name].js',
      publicPath: 'libs/',
      path: path.resolve(__dirname, 'libs', 'Base'),
    },
    target: universalTarget({
      dll: true,
    }),

    devtool: 'source-map',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json']
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            'cache-loader',
            {
              loader: 'ts-loader',
              options: { transpileOnly: true },
            },
          ],
        },
      ]
    },

    plugins: [
      // new webpack.NamedModulesPlugin(),
      new ForkTsCheckerWebpackPlugin(),
    ],

    externals: {
      'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
    },
  },


  {
    name: 'main',
    entry: {
      'main': [
        './src/index.tsx',
      ],
    },
    output: {
      library: 'main',
      filename: '[name].js',
      publicPath: 'libs/',
      path: path.resolve(__dirname, 'libs')
    },
    target: universalTarget({
      imports: [
        'Base'
      ],
    }),

    devtool: 'source-map',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json']
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            'cache-loader',
            {
              loader: 'ts-loader',
              options: { transpileOnly: true },
            },
          ],
        },
      ]
    },

    plugins: [
      // new webpack.NamedModulesPlugin(),
      new ForkTsCheckerWebpackPlugin(),
    ],

    externals: {
      'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
    },
  },
]
