import * as React from 'react';
import Hello from './components/Hello';

import('./test3' /* webpackChunkName: "test3" */).then(({ test3 }) => {
  test3('second');
});

export const App = () => <Hello name="second" compiler="TypeScript" framework="React" />;
