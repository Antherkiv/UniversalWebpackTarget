import * as React from 'react';
import { Switch, Route, Link } from 'react-router-dom';
import { Navbar, NavbarBrand, Nav, NavItem } from 'reactstrap';
import { loadable } from './loadable';

import Hello from './components/Hello';
import Login from './components/Login';

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
  <div>
    <Navbar color="light" light expand="md">
      <Link className="navbar-brand" to="/">
        first
      </Link>
      <Nav className="ml-auto" navbar>
        <NavItem>
          <Link className="nav-link" to="/test/one">
            Test 1
          </Link>
        </NavItem>
      </Nav>
      <Nav className="ml-auto" navbar>
        <NavItem>
          <Link className="nav-link" to="/test/two">
            Test 2
          </Link>
        </NavItem>
      </Nav>
      <Nav className="ml-auto" navbar>
        <NavItem>
          <Link className="nav-link" to="/login">
            Login
          </Link>
        </NavItem>
      </Nav>
    </Navbar>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/test/:name" component={Test} />
      <Route path="/login" component={Login} />
      <Route component={NoMatch} />
    </Switch>
  </div>
);
