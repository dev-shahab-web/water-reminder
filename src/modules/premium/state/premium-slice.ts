import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { PremiumAccess, PremiumCatalog, PremiumProduct } from '../types';
import { readPremiumPreferences, type PremiumPreferences } from '../storage/premium-preferences';

type PremiumState = {
  access: PremiumAccess;
  products: PremiumProduct[];
  status: 'idle' | 'loading' | 'ready' | 'unavailable';
  pending: boolean;
  preferences: PremiumPreferences;
};

const initialState: PremiumState = {
  access: { active: false, accessUntil: 0, productIds: [] },
  products: [],
  status: 'idle',
  pending: false,
  preferences: readPremiumPreferences(),
};

const premiumSlice = createSlice({
  name: 'premium',
  initialState,
  reducers: {
    catalogLoading(state) {
      state.status = 'loading';
    },
    catalogReceived(state, action: PayloadAction<PremiumCatalog>) {
      state.products = action.payload.products;
      state.access = action.payload.access;
      state.pending = action.payload.pending;
      state.status = 'ready';
    },
    catalogUnavailable(state) {
      state.status = 'unavailable';
      state.products = [];
    },
    accessExpired(state) {
      state.access = initialState.access;
    },
    cachedAccessReceived(state, action: PayloadAction<PremiumAccess>) {
      state.access = action.payload;
    },
    preferencesChanged(state, action: PayloadAction<PremiumPreferences>) {
      state.preferences = action.payload;
    },
  },
});

export const {
  catalogLoading,
  catalogReceived,
  catalogUnavailable,
  accessExpired,
  cachedAccessReceived,
  preferencesChanged,
} = premiumSlice.actions;
export const premiumReducer = premiumSlice.reducer;
