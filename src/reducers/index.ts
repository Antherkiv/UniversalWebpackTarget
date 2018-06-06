import { combineReducers } from 'redux';
import { RouterState } from 'connected-react-router';
import * as auth from './auth';

export interface State {
  auth: auth.Auth;
  router: RouterState;
}

const reducers = combineReducers({
  auth: auth.reducer,
});

export default reducers;
