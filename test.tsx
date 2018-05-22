import * as React from 'react';
import { Main } from './src/main';

import reactTestRenderer from 'react-test-renderer';

it('renders without crashing', () => {
  const rendered = reactTestRenderer.create(<Main />).toJSON();
  expect(rendered).toBeTruthy();
});
