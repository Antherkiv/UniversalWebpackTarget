/* eslint prettier/prettier:0 node/no-unpublished-require:0 */

const path = require('path');
const webpack = require('webpack');
const universalTarget = require('./webpack/universalTarget');
const PluggablePlugin = require('./webpack/PluggablePlugin');
const EntrySymlinkPlugin = require('./webpack/EntrySymlinkPlugin');

const development = !!process.env['npm_lifecycle_script'].match(/\bdevelopment\b/);

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
		  new EntrySymlinkPlugin(),
  		new PluggablePlugin(
        options.main,
        path.resolve(__dirname, 'libs'),
        options.imports
      ),
    ],

    externals: {
      'unicode/category/So': '{}', // Ignore unicode/category/So used (only in the server side) by node-slug.
    },

    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  }
}

module.exports = [

  factory({
    name: 'Base',
    entry: {
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
  }),

  factory({
    name: 'main',
    entry: {
      'main': [
        './src/main',
      ],
      'other': [
        './src/other',
      ],
    },
    imports: [
      'Base',
    ],
  }),

  factory({
    name: 'client',
    entry: {
      'client': [
        './src/client',
      ],
    },
    main: true,
    imports: [
      'Base',
      'main',
    ],
  }),

  factory({
    name: 'server',
    entry: {
      'server': [
        './src/server',
      ],
    },
    main: true,
    server: true,
    imports: [
      'Base',
      'main',
    ],
  }),

]
