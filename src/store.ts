import { applyMiddleware, createStore, compose } from 'redux';
import reduxLogger from 'redux-logger';
import reduxSaga from 'redux-saga';

import reducers from './reducers';
import sagas from './sagas';

export default function configureStore(initialState = {}) {
  const sagaMiddleware = reduxSaga();
  const middleware = [];
  let composeEnhancers = compose;
  middleware.push(sagaMiddleware);
  if (process.env.NODE_ENV === 'development') {
    middleware.push(reduxLogger); // reduxLogger must be last
  }
  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
  }
  const store = createStore(
    reducers,
    initialState,
    composeEnhancers(applyMiddleware(...middleware)),
  );

  sagaMiddleware.run(sagas);

  return store;
}
