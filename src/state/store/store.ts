import { configureStore, type UnknownAction } from '@reduxjs/toolkit';

type RootStateShape = Record<string, never>;

const initialState: RootStateShape = {};

const rootReducer = (
  state: RootStateShape = initialState,
  _action: UnknownAction,
): RootStateShape => state;

export const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
