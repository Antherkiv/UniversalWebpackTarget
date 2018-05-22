import * as React from 'react';

import * as styles from './styles.scss';

export interface HelloProps {
  name: string;
  compiler: string;
  framework: string;
}

export const Hello = (props: HelloProps) => (
  <h1 className={styles.className}>
    Hello {props.name} from {props.compiler} and {props.framework}!
  </h1>
);
