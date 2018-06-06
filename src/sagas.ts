import { call, put, takeLatest } from 'redux-saga/effects';
import { Actions, ActionTypes } from './actions/auth';

import { callApi } from './api';

const config = {
  authUrl: 'http://auth-sandbox-api.dubalu.off',
  authClientId: '_EZLqxMLY6guF1dLQWsLg0g~rLhyzN6lggu7nQ-RTQ0TMNQFQ6M',
  mashupId: '~3pZyPcFqGq',
};

function* auth(action: Actions) {
  switch (action.type) {
    case ActionTypes.LOGIN: {
      const { resetForm, setErrors, setSubmitting } = action.meta;
      try {
        const auth = yield callApi({
          endpoint: `${config.authUrl}/token`,
          json: {
            username: action.payload.email,
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
        // Reset the form just to be clean, then send the user to our
        // Dashboard which "requires" authentication.
        yield call(resetForm);
        yield call(setSubmitting, false);
        // yield call([history, 'navigate'], 'dashboard')
      } catch (e) {
        // If our API throws an error we will leverage Formik's existing error system to
        // pass it along to the view layer, as well as clearing the loading indicator.
        yield call(setErrors, { message: e.message });
        yield call(setSubmitting, false);
      }
      break;
    }
    case ActionTypes.LOGOUT:
    case ActionTypes.RECOVER:
    case ActionTypes.REGISTER:
      break;
  }
}

export default function* sagas() {
  yield takeLatest(ActionTypes.LOGIN, auth);
  yield takeLatest(ActionTypes.LOGOUT, auth);
  yield takeLatest(ActionTypes.RECOVER, auth);
  yield takeLatest(ActionTypes.REGISTER, auth);
}
