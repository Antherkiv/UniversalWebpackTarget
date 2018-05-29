import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as express from 'express';
import * as hogan from 'hogan-xpress';

import vm from 'vm';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

// Express
const app = express();

if (process.env.NODE_ENV === 'development') {
  const webpackConfig = require('../webpack.config.js') as webpack.Configuration[];
  const compiler = webpack(
    webpackConfig.map((options: webpack.Configuration) =>
      Object.assign(options, { mode: 'development' }),
    ),
  );

  const glob: any = global;
  glob.__requireLib = (request: string) => {
    if (glob.__requireLib && /^libs\//.test(request)) {
      return (
        require.cache[request] ||
        (() => {
          // require file from outputFileSystem:
          const module: any = {};
          const fs = (compiler.compilers[0] as webpack.Compiler).outputFileSystem;
          const content = fs.readFileSync('/' + request, 'utf-8');
          vm.runInThisContext(`(function(module) {\n${content}\n})`, request)(module);
          require.cache[request] = module.exports;
          return module.exports;
        })()
      );
    }
    return require(request);
  };

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
  const domains: DomainMap = {
    localhost: '/libs/app1/first.js',
    'first.off': '/libs/app1/first.js',
    'second.off': '/libs/app2/second.js',
    'third.off': '/libs/app2/third.js',
  };
  const app = domains[req.hostname];
  import(app)
    .then((entry: Pluggable) => {
      const { Main } = entry();
      res.locals.app = JSON.stringify(app);
      res.locals.main = ReactDOMServer.renderToString(<Main />);
      res.status(200).render('index.html');
    })
    .catch((err: Error) => {
      console.error(err);
      res.status(500);
    });
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
