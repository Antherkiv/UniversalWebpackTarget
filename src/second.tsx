import * as React from 'react';
import { Hello } from './components/Hello';

import(/* webpackChunkName: "test3" */ './test3').then(({ test3 }) => {
  test3('second');
});

export const Main = () => <Hello name="second" compiler="TypeScript" framework="React" />;
