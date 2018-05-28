import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as express from 'express';
import * as hogan from 'hogan-xpress';

import { Main } from './main';
import { Other } from './other';

import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
const webpackConfig = require('../webpack.config.js');

// Express
const app = express();

if (process.env.NODE_ENV === 'development') {
  const compiler = webpack(
    webpackConfig.map((options: webpack.Configuration) =>
      Object.assign(options, { mode: 'development' }),
    ),
  );
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: '/',
      serverSideRender: true,
    }),
  );
  app.use(webpackHotMiddleware(compiler));
}

app.set('view engine', 'html');
app.set('views', './');
app.engine('html', hogan);

app.get('/', (req: any, res: any) => {
  res.locals.main = ReactDOMServer.renderToString(<Main />);
  res.locals.other = ReactDOMServer.renderToString(<Other />);
  res.status(200).render('index.html');
});

app.use('/', express.static('.'));
app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'));

console.info(
  `==> ${process.env.NODE_ENV === 'production' ? '✅' : '🚧'} Server is listening in ${
    process.env.NODE_ENV
  } mode`,
);
console.info(`==> 💻 Go to http://localhost:${app.get('port')}`);
