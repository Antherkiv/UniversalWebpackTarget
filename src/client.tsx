import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { Provider } from 'react-redux';
import configureStore from './store';

import { loadComponents } from './loadable';

import consoleColorizer from 'console-colorizer';

// colorize console:
consoleColorizer(console);

import(APP).then((entry: Pluggable) => {
  const { App } = entry();
  const history = createBrowserHistory();
  const store = configureStore(history, INITIAL_STATE || {});
  const main = (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <App />
      </ConnectedRouter>
    </Provider>
  );
  loadComponents(main).then(() => {
    ReactDOM.hydrate(main, document.getElementById('main'));
  });
});
