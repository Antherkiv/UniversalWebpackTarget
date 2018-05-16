const path = require('path');

const webpack = require('webpack');
var HappyPack = require('happypack');
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
          loader: 'happypack/loader',
        },
        {
          enforce: 'pre',
          test: /\.js$/,
          use: [
            'source-map-loader',
          ],
        }
      ]
    },

    plugins: [
      // new webpack.NamedModulesPlugin(),
      new HappyPack({
        threads: 2,
        use: [
          'cache-loader',
          {
            loader: 'ts-loader',
            query: { happyPackMode: true }
          }
        ]
      }),
      new ForkTsCheckerWebpackPlugin({
        checkSyntacticErrors: true,
      })
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
          loader: 'happypack/loader',
        },
        {
          enforce: 'pre',
          test: /\.js$/,
          use: [
            'source-map-loader',
          ],
        }
      ]
    },

    plugins: [
      // new webpack.NamedModulesPlugin(),
      new HappyPack({
        threads: 2,
        use: [
          'cache-loader',
          {
            loader: 'ts-loader',
            query: { happyPackMode: true }
          }
        ]
      }),
      new ForkTsCheckerWebpackPlugin({
        checkSyntacticErrors: true,
      })
    ],

    externals: {
      'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
    },
  },
]
