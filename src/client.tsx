import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Main } from './main';
import { Other } from './other';

ReactDOM.hydrate(
    <Main />,
    document.getElementById('main'),
);

ReactDOM.hydrate(
    <Other />,
    document.getElementById('other'),
);
