import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as express from 'express';
import * as hogan from 'hogan-xpress';

import { Main } from './main';
import { Other } from './other';

// Express
const app = express();
app.set('view engine', 'html')
app.set('views', './')
app.engine('html', hogan);

app.get('/', (req:any, res:any) => {
  res.locals.main = ReactDOMServer.renderToString(
    <Main />
  );
  res.locals.other = ReactDOMServer.renderToString(
    <Other />
  );
  res.status(200).render('index.html');
})

app.use('/', express.static('.'));
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'))

console.info('==> ' + (process.env.NODE_ENV === "production" ? '✅' : '🚧') + ' Server is listening in ' + process.env.NODE_ENV + ' mode')
console.info('==> 💻 Go to http://localhost:%s', app.get('port'))
