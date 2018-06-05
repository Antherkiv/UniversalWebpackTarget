import { ReducersMapObject } from 'redux';

// From https://medium.com/@martin_hotell/improved-redux-type-safety-with-typescript-2-8-2c11a8062575

interface TypedAction<T extends string> {
  type: T;
}

interface TypedActionWithPayload<T extends string, P> extends TypedAction<T> {
  payload: P;
}

interface TypedActionWithMeta<T extends string, M> extends TypedAction<T> {
  meta: M;
}

interface TypedActionWithPayloadAndMeta<T extends string, P, M> extends TypedAction<T> {
  payload: P;
  meta: M;
}

export function createAction<T extends string>(type: T): TypedAction<T>;
export function createAction<T extends string, P>(
  type: T,
  payload: P,
): TypedActionWithPayload<T, P>;
export function createAction<T extends string, P, M>(
  type: T,
  payload: undefined,
  meta: M,
): TypedActionWithMeta<T, P>;
export function createAction<T extends string, P, M>(
  type: T,
  payload: P,
  meta: M,
): TypedActionWithPayloadAndMeta<T, P, M>;
export function createAction<T extends string, P, M>(type: T, payload?: P, meta?: M) {
  return meta
    ? payload
      ? { type, payload, meta }
      : { type, meta }
    : payload
      ? { type, payload }
      : { type };
}

export type ActionsUnion<A extends ReducersMapObject> = ReturnType<A[keyof A]>;
