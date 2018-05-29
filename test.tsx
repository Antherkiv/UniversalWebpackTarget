import * as React from 'react';
import { App } from './src/first';

import reactTestRenderer from 'react-test-renderer';

it('renders without crashing', () => {
  const rendered = reactTestRenderer.create(<App />).toJSON();
  expect(rendered).toBeTruthy();
});
