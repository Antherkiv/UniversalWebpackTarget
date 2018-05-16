import * as React from 'react';

export interface HelloProps {
  name: string;
  compiler: string;
  framework: string;
}

export const Hello = (props: HelloProps) => (
  <h1>
    Hello {props.name} from {props.compiler} and {props.framework}!
  </h1>
);
