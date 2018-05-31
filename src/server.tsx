import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as reactRouter from 'react-router';
import gaikan from 'gaikan';
import express from 'express';
import { loadComponents } from './loadable';

import helmet from 'helmet';

import vm from 'vm';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

const StaticRouter = reactRouter.StaticRouter;

// Express
const app: express.Express = express();

if (process.env.NODE_ENV === 'development') {
  const webpackConfig = require('../webpack.config.js') as webpack.Configuration[];

  // The following webpack plugin clears the require cache for built assets
  class ClearRequireCache {
    public apply(compiler: webpack.Compiler) {
      compiler.hooks.done.tap('ClearRequireCache', (stats: any) => {
        Object.keys(stats.compilation.assets)
          .map(asset =>
            path.join(stats.compilation.outputOptions.publicPath, asset).replace(/^\/|\/$/g, ''),
          )
          .forEach((request: string) => {
            delete require.cache[request];
          });
      });
    }
  }

  // Modify settings to add development mode and the cache cleanup plugin
  const compiler = webpack(
    webpackConfig.map((options: webpack.Configuration) => {
      if (options.plugins) {
        options.plugins.push(new ClearRequireCache());
      }
      return Object.assign(options, { mode: 'development' });
    }),
  );

  // Install global __requireLib() to load libs from the memory file system
  // and put them in cache.
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
    return glob.__require__(request);
  };

  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: '/',
      serverSideRender: true,
    }),
  );
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use(helmet());
}

gaikan.options.enableCache = true;
gaikan.options.rootDir = __dirname;
app.engine('html', gaikan);
app.set('view engine', 'html');
app.set('views', '.');

const domains: DomainMap = require('domains.json');

app.get(/^(.(?!\.(js|json|map|ico|png|jpg|jpeg|gif|svg|eot|ttf|woff|woff2)$))+$/, async (req, res) => {
  const app = domains[req.hostname];
  try {
    const entry = await import(app);
    const { App } = entry();
    // This context object contains the results of the render
    const routerContext = {} as reactRouter.match<any>;
    const main = (
      <StaticRouter location={req.url} context={routerContext}>
        <App />
      </StaticRouter>
    );
    await loadComponents(main);
    if (routerContext.url) {
      res.writeHead(302, {
        Location: routerContext.url,
      });
    } else {
      res.status(200).render('index.html', {
        main: ReactDOMServer.renderToString(main),
        app: JSON.stringify(app),
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500);
  }
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
