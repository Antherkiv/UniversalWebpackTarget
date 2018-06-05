import { call, put, select, takeLatest } from 'redux-saga/effects';
import { Actions, ActionTypes, Keychain } from './actions/auth';
import { State } from './reducers';

import { callApi } from './api';

const config = {
  authUrl: 'http://auth-sandbox-api.dubalu.off',
  authClientId: '_EZLqxMLY6guF1dLQWsLg0g~rLhyzN6lggu7nQ-RTQ0TMNQFQ6M',
  mashupId: '~3pZyPcFqGq',
};

function* auth(action: Actions) {
  try {
    switch (action.type) {
      case ActionTypes.LOGIN:
        const auth = yield callApi({
          endpoint: `${config.authUrl}/token`,
          json: {
            username: action.payload.user,
            password: action.payload.password,
            scope: 'terms privacy',
            client_id: config.authClientId,
            grant_type: 'password',
          },
        });
        const state = {
          auth: {
            meId: '?',
            keychain: {
              '?': {
                auth: {
                  base_url: config.authUrl,
                  access_token: auth.access_token,
                },
              },
            },
          },
        };
        const [myKeychain, globalKeychain] = yield Promise.all([
          callApi(
            {
              api: 'auth',
              endpoint: `/keychain/${auth.entity}:${config.mashupId}/`,
              method: 'POST',
            },
            state,
          ),
          callApi(
            {
              api: 'auth',
              endpoint: `/keychain/${config.mashupId}:${config.mashupId}/`,
              method: 'POST',
            },
            state,
          ),
        ]);
        const keychain = {
          entity: auth.entity,
          keychain: {
            ...myKeychain,
            ...globalKeychain,
          },
        };
        yield put(Actions.keychain(keychain));
        break;
      case ActionTypes.LOGOUT:
      case ActionTypes.RECOVER:
      case ActionTypes.REGISTER:
        break;
    }
    // const keychain: Keychain = {
    //   entity,
    //   keychain,
    // };
    // yield put(Actions.keychain(keychain));
  } catch (e) {
    console.error(e);
    // yield put(Actions.conversionError(e.message));
  }
}

export default function* sagas() {
  yield takeLatest(ActionTypes.LOGIN, auth);
  yield takeLatest(ActionTypes.LOGOUT, auth);
  yield takeLatest(ActionTypes.RECOVER, auth);
  yield takeLatest(ActionTypes.REGISTER, auth);
}
