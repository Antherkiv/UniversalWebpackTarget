import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { loadComponents } from './loadable';

import consoleColorizer from 'console-colorizer';

// colorize console:
consoleColorizer(console);

declare var app: string;

import(app).then((entry: Pluggable) => {
  const { App } = entry();
  const main = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  loadComponents(main).then(() => {
    ReactDOM.hydrate(main, document.getElementById('main'));
  });
});
