import * as React from 'react';
import { Switch, Route } from 'react-router-dom';
import 'bootstrap/scss/bootstrap.scss';

import { loadable } from './loadable';

import Navigation from './components/Navigation';
import Hello from './components/Hello';
import Login from './components/Login';
import Register from './components/Register';
import Recover from './components/Recover';

import('./test1' /* webpackChunkName: "test1", webpackPreload: true */).then(({ test1 }) => {
  test1('first');
  import('./test2' /* webpackChunkName: "test2", webpackPreload: true */).then(({ test2 }) => {
    test2('first');
    import('./test3' /* webpackChunkName: "test3" */).then(({ test3 }) => {
      test3('first');
    });
  });
});

const NoMatch = ({ location }: any) => (
  <h3>
    No match for <code>{location.pathname}</code>
  </h3>
);

const Home = loadable(() => import('./components/Home' /* webpackChunkName: "Home" */));

const Test = ({ match }: any) => {
  return <Hello name={match.params.name} compiler="TypeScript" framework="React" />;
};

export const App = () => (
  <React.Fragment>
    <Navigation />
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/test/:name" component={Test} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/recover" component={Recover} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);
