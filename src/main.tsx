import * as React from 'react';

import { Hello } from './components/Hello';

import(/* webpackChunkName: "test1" */ './test1').then(({ test1 }) => {
  test1('main');
  import(/* webpackChunkName: "test2" */ './test2').then(({ test2 }) => {
    test2('main');
    import(/* webpackChunkName: "test3" */ './test3').then(({ test3 }) => {
      test3('main');
    });
  });
});

export const loadApp = (app: string) => {
  import(app).then(({ app:string }) => {
    console.log(`Hello app ${app}`);
  });
}

export const Main = () =>
  <Hello name="main" compiler="TypeScript" framework="React" />;
