import { Actions, ActionTypes, ApiKey } from '../actions/auth';

export interface Auth {
  meId: string;
  keychain: {
    [entity: string]: {
      [api: string]: ApiKey;
    };
  };
}

export const initialState: Auth = {
  meId: '~notmet',
  keychain: {},
};

export const reducer = (state = initialState, action: Actions) => {
  switch (action.type) {
    case ActionTypes.LOGOUT: {
      return initialState;
    }
    case ActionTypes.KEYCHAIN:
      return {
        ...state,
        meId: action.payload.entity,
        keychain: {
          ...state.keychain,
          [action.payload.entity]: action.payload.keychain,
        },
      };
    default: {
      return state;
    }
  }
};
