import * as React from 'react';
import * as ReactDOM from 'react-dom';

declare var app: string;

import(app).then((entry: Pluggable) => {
  const { Main } = entry();
  ReactDOM.hydrate(<Main />, document.getElementById('main'));
});
