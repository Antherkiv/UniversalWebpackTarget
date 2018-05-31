import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

declare var app: string;

import(app).then((entry: Pluggable) => {
  const { App } = entry();
  const main = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  ReactDOM.hydrate(main, document.getElementById('main'));
});
