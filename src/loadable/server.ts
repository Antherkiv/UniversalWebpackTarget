/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Copyright 2017 Smooth Code

  This comes in parts from loadable-components/src/server/index.js
  [https://github.com/smooth-code/loadable-components/tree/v2.2.2]
*/
import * as React from 'react';

import { walkTree } from './tree';
import { LOADABLE } from './constants';

interface QueryType {
  promise: Promise<any>;
  element: React.ReactNode;
  context: {};
}

function getQueriesFromTree(rootElement: React.ReactNode, rootContext: {} = {}, fetchRoot = true) {
  const queries: QueryType[] = [];

  walkTree(rootElement, rootContext, (element, instance, context) => {
    const skipRoot = !fetchRoot && element === rootElement;
    if (instance && (instance.constructor as any)[LOADABLE] && !skipRoot) {
      const loadable = (instance.constructor as any)[LOADABLE]();
      const promise = loadable.load();

      queries.push({ promise, element, context });

      // Tell walkTree to not recurse inside this component; we will
      // wait for the query to execute before attempting it.
      return false;
    }
    return true;
  });

  return queries;
}

export function loadComponents(rootElement: React.ReactNode, rootContext: {} = {}, fetchRoot = true) {
  const queries = getQueriesFromTree(rootElement, rootContext, fetchRoot);
  // no queries found, nothing to do
  if (!queries.length) return Promise.resolve();

  const errors: Error[] = [];

  // wait on each query that we found, re-rendering the subtree when it's done
  const mappedQueries: Promise<any>[] = queries.map(({ promise, element, context }) =>
    // we've just grabbed the query for element, so don't try and get it again
    promise
      .then(() => {
        return loadComponents(element, context, false);
      })
      .catch(err => errors.push(err)),
  );

  return Promise.all(mappedQueries).then(() => {
    if (errors.length > 0) {
      if (errors.length === 1) {
        throw errors[0];
      } else {
        const err = new Error(`${errors.length} errors were thrown when importing your modules.`);
        (err as any).queryErrors = errors;
        throw err;
      }
    }
  });
}
