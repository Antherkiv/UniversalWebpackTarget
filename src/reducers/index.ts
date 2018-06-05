import { combineReducers } from 'redux';
import * as auth from './auth';

export interface State {
  auth: auth.Auth;
}

const reducers = combineReducers({
  auth: auth.reducer,
});

export default reducers;
