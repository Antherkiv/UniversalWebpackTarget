/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Copyright 2017 Smooth Code

  This comes in parts from loadable-components/src/server/index.js
  [https://github.com/smooth-code/loadable-components/tree/v2.2.2]
*/
import * as React from 'react';

export interface TreeVisitor {
  (element: React.ReactNode, instance: React.Component | null, context: {}, childContext?: {}): boolean;
}

function isReactElement(element: any): React.ReactElement<{}> | undefined {
  if (element.type) {
    return element;
  }
}

function isComponentClass(Component: any): React.ComponentClass | undefined {
  if (Component.prototype && (Component.prototype.render || Component.prototype.isReactComponent)) {
    return Component;
  }
}

function providesChildContext(instance: any) {
  return !!instance.getChildContext;
}

// Recurse a React Element tree, running visitor on each element.
// If visitor returns `false`, don't call the element's render function
//   or recurse into its child elements
export function walkTree(element: React.ReactNode, context: {}, visitor: TreeVisitor) {
  if (Array.isArray(element)) {
    element.forEach(item => walkTree(item, context, visitor));
    return;
  }

  if (!element) {
    return;
  }

  // a stateless functional component or a class
  const reactElement = isReactElement(element);
  if (reactElement) {
    if (typeof reactElement.type === 'function') {
      const Component = reactElement.type;
      const props = Object.assign({}, Component.defaultProps, reactElement.props);
      let childContext = context;
      let child: React.ReactNode;

      // Are we are a react class?
      // tslint:disable-next-line:max-line-length
      //   https://github.com/facebook/react/blob/master/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L66
      const componentClass = isComponentClass(Component);
      if (componentClass) {
        const instance = new componentClass(props, context);
        // In case the user doesn't pass these to super in the constructor
        instance.props = instance.props || props;
        instance.context = instance.context || context;
        // set the instance state to null (not undefined) if not set, to match React behaviour
        instance.state = instance.state || null;

        // Override setState to just change the state, not queue up an update.
        //   (we can't do the default React thing as we aren't mounted "properly"
        //   however, we don't need to re-render as well only support setState in
        //   componentWillMount, which happens *before* render).
        instance.setState = newState => {
          instance.state = Object.assign(
            {},
            instance.state,
            typeof newState === 'function'
              ? // React's TS type definitions don't contain context as a third parameter for
                // setState's updater function.
                // Remove this cast to `any` when that is fixed.
                (newState as any)(instance.state, instance.props, instance.context)
              : newState,
          );
        };

        // this is a poor man's version of
        // tslint:disable-next-line:max-line-length
        //   https://github.com/facebook/react/blob/master/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L181
        if (instance.componentWillMount) {
          instance.componentWillMount();
        }

        if (providesChildContext(instance)) {
          childContext = Object.assign({}, context, (instance as any).getChildContext());
        }

        if (visitor(reactElement, instance, context, childContext) === false) {
          return;
        }

        child = instance.render();
      } else {
        // just a stateless functional
        if (visitor(reactElement, null, context) === false) {
          return;
        }

        child = (Component as React.StatelessComponent)(props, context);
      }

      if (child) {
        if (Array.isArray(child)) {
          child.forEach(item => walkTree(item, childContext, visitor));
        } else {
          walkTree(child, childContext, visitor);
        }
      }
    } else {
      // a basic string or dom element, just get children
      if (visitor(reactElement, null, context) === false) {
        return;
      }

      // Context.Provider
      if (reactElement.type && (reactElement.type as any)._context) {
        (reactElement.type as any)._context._currentValue = (reactElement.props as any).value;
      }

      // Context.Consumer
      if (reactElement && reactElement.type && (reactElement.type as any).Provider) {
        const child = (reactElement.props as any).children((reactElement.type as any)._currentValue);
        if (child) {
          walkTree(child, context, visitor);
        }
      }

      if (reactElement.props && (reactElement.props as any).children) {
        React.Children.forEach((reactElement.props as any).children, (child: any) => {
          if (child) {
            walkTree(child, context, visitor);
          }
        });
      }
    }
  } else if (typeof element === 'string' || typeof element === 'number') {
    // Just visit these, they are leaves so we don't keep traversing.
    visitor(element, null, context);
  }
  // TODO: Portals?
}
