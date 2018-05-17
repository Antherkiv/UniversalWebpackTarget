import * as React from 'react';

import { Hello } from './components/Hello';

import(/* webpackChunkName: "test3" */ './test3').then(({ test3 }) => {
  test3('other');
});

export const Other = () =>
  <Hello name="other" compiler="TypeScript" framework="React" />;
