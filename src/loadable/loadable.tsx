/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Copyright 2017 Smooth Code

  This comes in parts from loadable-components/src/loadable.js
  [https://github.com/smooth-code/loadable-components/tree/v2.2.2]
*/

import * as React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { LOADABLE } from './constants';

const EmptyComponent = () => null;

interface LoadableState {
  loading: boolean;
  Component?: React.ComponentType;
  error?: Error;
}

interface LoadableOptions {
  ErrorComponent?: React.ComponentType<any>;
  LoadingComponent?: React.ComponentType<any>;
}

export default function loadable(
  getComponent: () => Promise<any>,
  { ErrorComponent = EmptyComponent, LoadingComponent = EmptyComponent }: LoadableOptions = {},
) {
  class LoadableComponent extends React.Component<{}, LoadableState> {
    private static Component: React.ComponentType;
    private static loadingPromise: Promise<any>;

    private mounted = false;
    private loadingPromise?: Promise<any>;

    constructor(props: any) {
      super(props);
      this.state = {
        loading: !LoadableComponent.Component,
        Component: LoadableComponent.Component,
      };

      if (typeof window !== 'undefined' && !this.state.Component && !this.loadingPromise) {
        this.loadingPromise = LoadableComponent.load()
          .then((Component: React.ComponentType) => {
            this.safeSetState({ Component, loading: false });
          })
          .catch((error: Error) => {
            this.safeSetState({ error, loading: false });
          });
      }
    }

    public static load() {
      if (!LoadableComponent.loadingPromise) {
        LoadableComponent.loadingPromise = getComponent()
          .then(module => {
            const Component: React.ComponentType = module.__esModule ? module.default : module;
            LoadableComponent.Component = Component;
            hoistNonReactStatics(LoadableComponent, Component, {
              Component: true,
              loadingPromise: true,
              load: true,
            });
            return Component;
          })
          .catch(error => {
            delete LoadableComponent.loadingPromise;
            throw error;
          });
      }
      return LoadableComponent.loadingPromise;
    }

    public componentDidMount() {
      this.mounted = true;
    }

    public componentWillUnmount() {
      this.mounted = false;
    }

    public render() {
      const { Component, error } = this.state;

      if (Component) {
        return <Component {...this.props} />;
      }

      if (error) {
        return <ErrorComponent error={error} ownProps={this.props} />;
      }

      return <LoadingComponent {...this.props} />;
    }

    private safeSetState(state: LoadableState) {
      if (!this.mounted) return;
      this.setState(state);
    }
  }

  (LoadableComponent as any)[LOADABLE] = () => LoadableComponent;

  return LoadableComponent;
}
