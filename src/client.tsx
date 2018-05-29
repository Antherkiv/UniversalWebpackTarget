import * as React from 'react';
import * as ReactDOM from 'react-dom';

declare var app: string;

import(app).then((entry: Pluggable) => {
  const { App } = entry();
  ReactDOM.hydrate(<App />, document.getElementById('main'));
});
