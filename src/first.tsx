import * as React from 'react';

import { Hello } from './components/Hello';

import(/* webpackChunkName: "test1", webpackPreload: true */ './test1').then(({ test1 }) => {
  test1('first');
  import(/* webpackChunkName: "test2", webpackPreload: true */ './test2').then(({ test2 }) => {
    test2('first');
    import(/* webpackChunkName: "test3" */ './test3').then(({ test3 }) => {
      test3('first');
    });
  });
});

export const Main = () => <Hello name="first" compiler="TypeScript" framework="React" />;
