import { call, put, select, takeLatest } from 'redux-saga/effects';
import { Actions, ActionTypes } from './actions/auth';
import { push } from 'connected-react-router';
import { callApi, selectApiInfo } from './api';

const config = {
  authUrl: 'https://auth-sandbox-api.dubalu.off',
  authClientId: '_iaFT-zv6b7ePPgLwrmDlWlkrXPiCAvCuYOVaWStc-II~MyRfaw8TudiAfnwx3bu3pC2E2Ss',
  mashupId: '~2RtpU94f9CnoO5a',
};

function* auth(action: Actions) {
  switch (action.type) {
    ////////////////////////////////////////////////////////////////////////////
    //   _                _
    //  | |    ___   __ _(_)_ __
    //  | |   / _ \ / _` | | '_ \
    //  | |__| (_) | (_| | | | | |
    //  |_____\___/ \__, |_|_| |_|
    //              |___/
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
        yield put(push('/dashboard'));
      } catch (e) {
        // If our API throws an error we will leverage Formik's existing error system to
        // pass it along to the view layer, as well as clearing the loading indicator.
        yield call(setErrors, { message: e.message });
        yield call(setSubmitting, false);
      }
      break;
    }
    ////////////////////////////////////////////////////////////////////////////
    //   _                            _
    //  | |    ___   __ _  ___  _   _| |_
    //  | |   / _ \ / _` |/ _ \| | | | __|
    //  | |__| (_) | (_| | (_) | |_| | |_
    //  |_____\___/ \__, |\___/ \__,_|\__|
    //              |___/
    case ActionTypes.LOGOUT: {
      try {
        const { access_token: token } = yield select(selectApiInfo.bind(null, 'auth'));
        yield callApi({
          endpoint: `${config.authUrl}/revoke`,
          json: {
            token,
            client_id: config.authClientId,
          },
        });
      } catch (e) {
      }
      break;
    }
    ////////////////////////////////////////////////////////////////////////////
    //   ____
    //  |  _ \ ___  ___ _____   _____ _ __
    //  | |_) / _ \/ __/ _ \ \ / / _ \ '__|
    //  |  _ <  __/ (_| (_) \ V /  __/ |
    //  |_| \_\___|\___\___/ \_/ \___|_|

    case ActionTypes.RECOVER: {
      const { resetForm, setErrors, setSubmitting } = action.meta;
      try {
        yield callApi({
          endpoint: `${config.authUrl}/authorize`,
          json: {
            username: action.payload.email,
            response_type: 'email',
            client_id: config.authClientId,
            scope: 'terms privacy',
          },
        });
        // Reset the form just to be clean, then send the user to our
        // Dashboard which "requires" authentication.
        yield call(resetForm);
        yield call(setSubmitting, false);
        yield put(push('/recover/email'));
      } catch (e) {
        // If our API throws an error we will leverage Formik's existing error system to
        // pass it along to the view layer, as well as clearing the loading indicator.
        yield call(setErrors, { message: e.message });
        yield call(setSubmitting, false);
      }
      break;
    }
    ////////////////////////////////////////////////////////////////////////////
    //   ____            _     _
    //  |  _ \ ___  __ _(_)___| |_ ___ _ __
    //  | |_) / _ \/ _` | / __| __/ _ \ '__|
    //  |  _ <  __/ (_| | \__ \ ||  __/ |
    //  |_| \_\___|\__, |_|___/\__\___|_|
    //             |___/
    case ActionTypes.REGISTER: {
      const { resetForm, setErrors, setSubmitting } = action.meta;
      try {
        yield callApi({
          endpoint: `${config.authUrl}/authorize`,
          json: {
            full_name: action.payload.name,
            username: action.payload.email,
            password: action.payload.password,
            response_type: 'registration',
            client_id: config.authClientId,
            scope: 'terms privacy',
          },
        });
        // Reset the form just to be clean, then send the user to our
        // Dashboard which "requires" authentication.
        yield call(resetForm);
        yield call(setSubmitting, false);
        yield put(push('/register/email'));
      } catch (e) {
        // If our API throws an error we will leverage Formik's existing error system to
        // pass it along to the view layer, as well as clearing the loading indicator.
        yield call(setErrors, { message: e.message });
        yield call(setSubmitting, false);
      }
      break;
    }
  }
}

export default function* sagas() {
  yield takeLatest(ActionTypes.LOGIN, auth);
  yield takeLatest(ActionTypes.LOGOUT, auth);
  yield takeLatest(ActionTypes.RECOVER, auth);
  yield takeLatest(ActionTypes.REGISTER, auth);
}
