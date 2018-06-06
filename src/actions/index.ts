interface TypedAction<T extends string> {
  type: T;
}

interface TypedActionWithPayload<T extends string, P> extends TypedAction<T> {
  payload: P;
}

interface TypedActionWithMeta<T extends string, M> extends TypedAction<T> {
  meta: M;
}

interface TypedActionWithPayloadAndMeta<T extends string, P, M>
  extends TypedActionWithPayload<T, P>,
    TypedActionWithMeta<T, M> {
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
): TypedActionWithMeta<T, M>;
export function createAction<T extends string, P, M>(
  type: T,
  payload: P,
  meta: M,
): TypedActionWithPayloadAndMeta<T, P, M>;
export function createAction<T extends string, P, M>(type: T, payload?: P, meta?: M) {
  return typeof meta !== 'undefined'
    ? typeof payload !== 'undefined'
      ? { type, payload, meta }
      : { type, meta }
    : typeof payload !== 'undefined'
      ? { type, payload }
      : { type };
}

export type ActionFactory<S = any> = (...args: any[]) => S;
export type ActionsMapObject<S = any> = { [K in keyof S]: ActionFactory<S[K]> };
export type ActionsUnion<A extends ActionsMapObject> = ReturnType<A[keyof A]>;
