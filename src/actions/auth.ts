import { FormikActions } from 'formik';
import { createAction, ActionsUnion } from '.';

export enum ActionTypes {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  RECOVER = 'RECOVER',
  REGISTER = 'REGISTER',
  KEYCHAIN = 'KEYCHAIN',
}

export interface ApiKey {
  api_code: string;
  app: string;
  api: string;
  base_url: string;
  name: string;
  client_id: string;
  expires_in?: number;
  token_type: 'Bearer';
  access_token: string;
  scope?: string;
  available_scopes?: {
    [scope: string]: string;
  };
  refresh_token?: string;
  description?: string;
  dependencies?: string[];
}

export interface LoginValues {
  email: string;
  password: string;
  message?: string;
}

export interface RecoverValues {
  email: string;
  message?: string;
}

export interface RegisterValues {
  email: string;
  password: string;
  name: string;
  message?: string;
}

export interface Keychain {
  entity: string;
  keychain: {
    [api: string]: ApiKey;
  };
}

export const Actions = {
  login: (email: string, password: string, formikActions: FormikActions<LoginValues>) =>
    createAction(ActionTypes.LOGIN, { email, password }, formikActions),
  logout: () => createAction(ActionTypes.LOGOUT),
  recover: (email: string, formikActions: FormikActions<RecoverValues>) =>
    createAction(ActionTypes.RECOVER, { email }, formikActions),
  register: (
    email: string,
    password: string,
    name: string,
    formikActions: FormikActions<RecoverValues>,
  ) => createAction(ActionTypes.REGISTER, { email, password, name }, formikActions),
  keychain: (keychain: Keychain) => createAction(ActionTypes.KEYCHAIN, keychain),
};
export type Actions = ActionsUnion<typeof Actions>;
