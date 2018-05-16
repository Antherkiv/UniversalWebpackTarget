import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Hello } from './components/Hello';

import(/* webpackChunkName: "test" */ './test').then(({ test }) => test());

ReactDOM.render(<Hello compiler="TypeScript" framework="React" />, document.getElementById('example'));
