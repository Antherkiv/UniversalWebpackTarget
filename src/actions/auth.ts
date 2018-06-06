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

export interface Login {
  email: string;
  password: string;
}

export interface LoginValues extends Login {
  message?: string;
}

export interface LoginParams extends Login {
  formikActions: FormikActions<LoginValues>;
}

export interface LogoutParams {
  formikActions: FormikActions<{}>;
}

export interface Recover {
  email: string;
}
export interface RecoverValues extends Recover {
  message?: string;
}
export interface RecoverParams extends Recover {
  formikActions: FormikActions<RecoverValues>;
}

export interface Register {
  email: string;
  password: string;
  name: string;
}
export interface RegisterValues extends Register {
  message?: string;
}
export interface RegisterParams extends Register {
  formikActions: FormikActions<RegisterValues>;
}

export interface Keychain {
  entity: string;
  keychain: {
    [api: string]: ApiKey;
  };
}

export const Actions = {
  login: ({ email, password, formikActions }: LoginParams) =>
    createAction(ActionTypes.LOGIN, { email, password }, formikActions),
  logout: ({ formikActions }: LogoutParams) =>
    createAction(ActionTypes.LOGOUT, undefined, formikActions),
  recover: ({ email, formikActions }: RecoverParams) =>
    createAction(ActionTypes.RECOVER, { email }, formikActions),
  register: ({ email, password, name, formikActions }: RegisterParams) =>
    createAction(ActionTypes.REGISTER, { email, password, name }, formikActions),
  keychain: (keychain: Keychain) => createAction(ActionTypes.KEYCHAIN, keychain),
};
export type Actions = ActionsUnion<typeof Actions>;
