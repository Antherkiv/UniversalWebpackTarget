import { ReducersMapObject } from 'redux';

// From https://medium.com/@martin_hotell/improved-redux-type-safety-with-typescript-2-8-2c11a8062575

export interface TypedAction<T extends string> {
  type: T;
}

export interface AnyTypedAction<T extends string, P> extends TypedAction<T> {
  payload: P;
}

export function createAction<T extends string>(type: T): TypedAction<T>;
export function createAction<T extends string, P>(type: T, payload: P): AnyTypedAction<T, P>;
export function createAction<T extends string, P>(type: T, payload?: P) {
  return payload === undefined ? { type } : { type, payload };
}

export type ActionsUnion<A extends ReducersMapObject> = ReturnType<A[keyof A]>;
