import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Hello } from './components/Hello';

import(/* webpackChunkName: "test3" */ './test3').then(({ test3 }) => {
  test3('other');
});

ReactDOM.render(
  <Hello name="other" compiler="TypeScript" framework="React" />,
  document.getElementById('other'),
);
