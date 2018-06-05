import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from './store';

import { loadComponents } from './loadable';

import consoleColorizer from 'console-colorizer';

// colorize console:
consoleColorizer(console);

import(APP).then((entry: Pluggable) => {
  const { App } = entry();
  const main = (
    <Provider store={configureStore(INITIAL_STATE || {})}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
  loadComponents(main).then(() => {
    ReactDOM.hydrate(main, document.getElementById('main'));
  });
});
