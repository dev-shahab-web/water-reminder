import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { queueBestEffortHealthConnectSync } from '@modules/health-connect/services/health-connect-sync-service';
import { refreshHydrationWidgets } from '@modules/widgets';
import { trackEventSafely } from '@platform/telemetry';

import {
  deleteHydrationEntry,
  getTodayHydrationEntries,
  updateHydrationEntry,
} from '../repository/hydration-repository';
import { persistHydrationLog } from '../services/hydration-log-service';
import { refreshHomeHydrationFromCanonicalSource } from '../services/home-refresh-service';
import type { HydrationEntry, HydrationEntrySource, HydrationLogFeedback } from '../types';
import { getLocalDateKey } from '../utils/date';
import { reconcileLoggedEntry, shouldApplyHydrationRead } from './hydration-state-reconciliation';

type HydrationStatus = 'idle' | 'loading' | 'ready' | 'saving' | 'error';

type HydrationState = {
  activeReadRequestId?: string;
  entries: HydrationEntry[];
  errorMessage?: string;
  lastChangedEntry?: HydrationEntry;
  lastLogFeedback?: HydrationLogFeedback;
  status: HydrationStatus;
};

const initialState: HydrationState = {
  entries: [],
  status: 'idle',
};

export const loadTodayHydration = createAsyncThunk('hydration/loadToday', async () =>
  getTodayHydrationEntries(),
);

export const refreshHomeHydration = createAsyncThunk(
  'hydration/refreshHome',
  async (): Promise<{ entries: HydrationEntry[]; healthSyncFailed: boolean }> =>
    refreshHomeHydrationFromCanonicalSource(),
);

export const logHydration = createAsyncThunk(
  'hydration/log',
  async ({ amount, source }: { amount: number; source: HydrationEntrySource }) => {
    return persistHydrationLog({ amount, source });
  },
);

export const editHydrationEntry = createAsyncThunk(
  'hydration/edit',
  async ({ amount, id }: { amount: number; id: string }) => {
    const entry = await updateHydrationEntry({ amount, id });

    if (entry === null) {
      throw new Error('Hydration entry could not be found.');
    }

    await refreshHydrationWidgets('hydration_changed');
    void queueBestEffortHealthConnectSync();
    trackEventSafely('hydration_edit_action', { source: 'app' });

    return entry;
  },
);

export const removeHydrationEntry = createAsyncThunk('hydration/remove', async (id: string) => {
  const deletedId = await deleteHydrationEntry(id);

  await refreshHydrationWidgets('hydration_changed');
  void queueBestEffortHealthConnectSync();
  trackEventSafely('hydration_delete_action', { source: 'app' });

  return deletedId;
});

const sortEntries = (entries: HydrationEntry[]) => {
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

const isTodayEntry = (entry: HydrationEntry): boolean => {
  return getLocalDateKey(new Date(entry.timestamp)) === getLocalDateKey();
};

export const hydrationSlice = createSlice({
  initialState,
  name: 'hydration',
  reducers: {
    clearLastChangedEntry: (state) => {
      state.lastChangedEntry = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTodayHydration.pending, (state, action) => {
        state.activeReadRequestId = action.meta.requestId;
        state.status = state.status === 'idle' ? 'loading' : state.status;
        state.errorMessage = undefined;
      })
      .addCase(loadTodayHydration.fulfilled, (state, action) => {
        if (!shouldApplyHydrationRead(state.activeReadRequestId, action.meta.requestId)) {
          return;
        }

        state.entries = action.payload;
        state.activeReadRequestId = undefined;
        state.status = 'ready';
      })
      .addCase(loadTodayHydration.rejected, (state, action) => {
        if (!shouldApplyHydrationRead(state.activeReadRequestId, action.meta.requestId)) {
          return;
        }

        state.activeReadRequestId = undefined;
        state.status = 'error';
        state.errorMessage = 'Today could not be loaded.';
      })
      .addCase(refreshHomeHydration.pending, (state, action) => {
        state.activeReadRequestId = action.meta.requestId;
        state.errorMessage = undefined;
      })
      .addCase(refreshHomeHydration.fulfilled, (state, action) => {
        if (!shouldApplyHydrationRead(state.activeReadRequestId, action.meta.requestId)) {
          return;
        }

        state.entries = action.payload.entries;
        state.activeReadRequestId = undefined;
        state.status = 'ready';
      })
      .addCase(refreshHomeHydration.rejected, (state, action) => {
        if (!shouldApplyHydrationRead(state.activeReadRequestId, action.meta.requestId)) {
          return;
        }

        state.activeReadRequestId = undefined;
        state.status = 'error';
        state.errorMessage = 'Today could not be refreshed.';
      })
      .addCase(logHydration.pending, (state) => {
        state.activeReadRequestId = undefined;
        state.status = 'saving';
        state.errorMessage = undefined;
      })
      .addCase(logHydration.fulfilled, (state, action: PayloadAction<HydrationEntry>) => {
        const reconciliation = reconcileLoggedEntry(state.entries, action.payload);
        const previousTotal = reconciliation.previousTotal;
        state.lastLogFeedback = {
          id: action.payload.id,
          amount: action.payload.amount,
          previousTotal,
          nextTotal: previousTotal + action.payload.amount,
        };
        state.entries = reconciliation.entries;
        state.activeReadRequestId = undefined;
        state.lastChangedEntry = action.payload;
        state.status = 'ready';
      })
      .addCase(logHydration.rejected, (state) => {
        state.activeReadRequestId = undefined;
        state.status = 'error';
        state.errorMessage = 'Water could not be logged.';
      })
      .addCase(editHydrationEntry.pending, (state) => {
        state.activeReadRequestId = undefined;
        state.status = 'saving';
        state.errorMessage = undefined;
      })
      .addCase(editHydrationEntry.fulfilled, (state, action: PayloadAction<HydrationEntry>) => {
        state.activeReadRequestId = undefined;
        const index = state.entries.findIndex((entry) => entry.id === action.payload.id);

        if (index >= 0) {
          if (isTodayEntry(action.payload)) {
            state.entries[index] = action.payload;
          } else {
            state.entries.splice(index, 1);
          }
        } else if (isTodayEntry(action.payload)) {
          state.entries.unshift(action.payload);
        }

        sortEntries(state.entries);
        state.lastChangedEntry = action.payload;
        state.status = 'ready';
      })
      .addCase(editHydrationEntry.rejected, (state) => {
        state.activeReadRequestId = undefined;
        state.status = 'error';
        state.errorMessage = 'Entry could not be updated.';
      })
      .addCase(removeHydrationEntry.pending, (state) => {
        state.activeReadRequestId = undefined;
        state.status = 'saving';
        state.errorMessage = undefined;
      })
      .addCase(removeHydrationEntry.fulfilled, (state, action: PayloadAction<string>) => {
        state.activeReadRequestId = undefined;
        state.entries = state.entries.filter((entry) => entry.id !== action.payload);
        state.lastChangedEntry = undefined;
        state.status = 'ready';
      })
      .addCase(removeHydrationEntry.rejected, (state) => {
        state.activeReadRequestId = undefined;
        state.status = 'error';
        state.errorMessage = 'Entry could not be deleted.';
      });
  },
});

export const { clearLastChangedEntry } = hydrationSlice.actions;
export const hydrationReducer = hydrationSlice.reducer;
