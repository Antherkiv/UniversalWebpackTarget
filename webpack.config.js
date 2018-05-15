const path = require('path');

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
        { test: /\.tsx?$/, loader: 'ts-loader' },
        { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
      ]
    },

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
        { test: /\.tsx?$/, loader: 'ts-loader' },
        { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
      ]
    },

    externals: {
      'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
    },
  },
]
