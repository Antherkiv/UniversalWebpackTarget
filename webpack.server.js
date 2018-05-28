const { factory } = require('./webpack.common');

module.exports = [
  // Server:
  factory({
    name: 'server',
    entry: {
      server: ['./src/server'],
    },
    server: true,
  }),
];
