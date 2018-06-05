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

export interface Login {
  user: string;
  password: string;
}

export interface Recover {
  user: string;
}

export interface Register {
  user: string;
  password: string;
  name: string;
}

export interface Keychain {
  entity: string;
  keychain: {
    [api: string]: ApiKey;
  };
}

export const Actions = {
  login: (login: Login) => createAction(ActionTypes.LOGIN, login),
  logout: () => createAction(ActionTypes.LOGOUT),
  recover: (recover: Recover) => createAction(ActionTypes.RECOVER, recover),
  register: (register: Register) => createAction(ActionTypes.REGISTER, register),
  keychain: (keychain: Keychain) => createAction(ActionTypes.KEYCHAIN, keychain),
};

typeof Actions;

export type Actions = ActionsUnion<typeof Actions>;
