const { development, factory } = require('./webpack.common');

module.exports = [
  // Dependencies and libraries:
  factory({
    name: 'Base',
    entry: {
      React: ['react'],
      ReactDom: ['react-dom'],
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
    imports: ['Base'],
  }),

  factory({
    name: 'app2',
    entry: {
      second: ['./src/second'],
      third: ['./src/third'],
    },
    dll: true,
    imports: ['Base'],
  }),

  // Client:
  factory({
    name: 'client',
    entry: {
      client: development ? ['./src/client', 'webpack-hot-middleware/client'] : ['./src/client'],
    },
    imports: ['Base'],
  }),

  // Server:
  factory({
    name: 'server',
    entry: {
      server: ['./src/server'],
    },
    server: true,
    imports: ['Base'],
  }),
];
