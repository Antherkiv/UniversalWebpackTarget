const { development, factory } = require('./webpack.common');

module.exports = [
  // Dependencies and libraries:
  factory({
    name: 'Libs',
    entry: {
      Common: [
        'ansi-html',
        'color-name',
        'connected-react-router',
        'fbjs',
        'history',
        'hoist-non-react-statics',
        'html-entities',
        'prop-types',
        'qs',
        'react-dom',
        'react',
        'react-router',
        'react-router-dom',
        'reactstrap',
        'redux-saga',
        'redux',
        'react-redux',
        'redux-logger',
        'invariant',
        'object-assign',
      ],
      Dubalu: ['console-colorizer'],
      Logger: ['./src/logger'],
    },
    dll: true,
  }),

  // Apps:
  factory({
    name: 'app1',
    entry: {
      first: ['./src/first'],
    },
    dll: true,
    imports: ['Libs'],
  }),

  factory({
    name: 'app2',
    entry: {
      second: ['./src/second'],
      third: ['./src/third'],
    },
    dll: true,
    imports: ['Libs'],
  }),

  // Client:
  factory({
    name: 'client',
    entry: {
      client: development ? ['./src/client', 'webpack-hot-middleware/client'] : ['./src/client'],
    },
    imports: ['Libs'],
  }),

  // Server:
  factory({
    name: 'server',
    entry: {
      server: ['./src/server'],
    },
    imports: ['Libs'],
  }),
];
