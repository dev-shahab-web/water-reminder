import { configureStore } from '@reduxjs/toolkit';

import { hydrationReducer } from '@modules/hydration';

export const store = configureStore({
  reducer: {
    hydration: hydrationReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
