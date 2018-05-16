import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Hello } from './components/Hello';

import(/* webpackPrefetch: true */ './test').then(({ test }) => test());

ReactDOM.render(<Hello compiler="TypeScript" framework="React" />, document.getElementById('example'));
