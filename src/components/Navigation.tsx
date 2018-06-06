import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { NavLink as NavLink } from 'react-router-dom';
import { Navbar, Nav, NavItem } from 'reactstrap';

import { Actions } from '../actions/auth';
import { State } from '../reducers';

interface NavigationProps {
  isAnonymous: boolean;
  onLogout(): void;
}

const Navigation: React.SFC<NavigationProps> = ({ isAnonymous, onLogout }) => (
  <Navbar color="dark" dark expand="md">
    <NavLink className="nav-link navbar-brand" to="/">
      first
    </NavLink>
    <Nav className="ml-auto" navbar>
      <NavItem>
        <NavLink className="nav-link" to="/test/one">
          Test 1
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink className="nav-link" to="/test/two">
          Test 2
        </NavLink>
      </NavItem>
      {isAnonymous ? (
        <NavItem>
          <NavLink className="nav-link" to="/login">
            Login
          </NavLink>
        </NavItem>
      ) : (
        <React.Fragment>
          <NavItem>
            <NavLink className="nav-link" to="/dashboard">
              Name Here
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink className="nav-link" to="/" onClick={onLogout}>
              Logout
            </NavLink>
          </NavItem>
        </React.Fragment>
      )}
    </Nav>
  </Navbar>
);

const mapStateToProps = (state: State) => ({
  isAnonymous: state.auth.meId === '~notmet',
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onLogout: () => {
    dispatch(Actions.logout());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Navigation);
