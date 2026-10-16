import { configureStore } from '@reduxjs/toolkit';

import { hydrationReducer } from '@modules/hydration';
import { premiumReducer } from '@modules/premium/state/premium-slice';

export const store = configureStore({
  reducer: {
    hydration: hydrationReducer,
    premium: premiumReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
