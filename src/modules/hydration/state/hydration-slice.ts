import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { queueBestEffortHealthConnectSync } from '@modules/health-connect/services/health-connect-sync-service';
import { refreshHydrationWidgets } from '@modules/widgets';

import {
  addHydrationEntry,
  deleteHydrationEntry,
  getTodayHydrationEntries,
  updateHydrationEntry,
} from '../repository/hydration-repository';
import { refreshHomeHydrationFromCanonicalSource } from '../services/home-refresh-service';
import type { HydrationEntry, HydrationEntrySource } from '../types';
import { getLocalDateKey } from '../utils/date';

type HydrationStatus = 'idle' | 'loading' | 'ready' | 'saving' | 'error';

type HydrationState = {
  entries: HydrationEntry[];
  errorMessage?: string;
  lastChangedEntry?: HydrationEntry;
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
    const entry = await addHydrationEntry({ amount, source });

    void refreshHydrationWidgets('hydration_changed');
    void queueBestEffortHealthConnectSync();

    return entry;
  },
);

export const editHydrationEntry = createAsyncThunk(
  'hydration/edit',
  async ({ amount, id }: { amount: number; id: string }) => {
    const entry = await updateHydrationEntry({ amount, id });

    if (entry === null) {
      throw new Error('Hydration entry could not be found.');
    }

    void refreshHydrationWidgets('hydration_changed');
    void queueBestEffortHealthConnectSync();

    return entry;
  },
);

export const removeHydrationEntry = createAsyncThunk('hydration/remove', async (id: string) => {
  const deletedId = await deleteHydrationEntry(id);

  void refreshHydrationWidgets('hydration_changed');
  void queueBestEffortHealthConnectSync();

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
      .addCase(loadTodayHydration.pending, (state) => {
        state.status = state.status === 'idle' ? 'loading' : state.status;
        state.errorMessage = undefined;
      })
      .addCase(loadTodayHydration.fulfilled, (state, action: PayloadAction<HydrationEntry[]>) => {
        state.entries = action.payload;
        state.status = 'ready';
      })
      .addCase(loadTodayHydration.rejected, (state) => {
        state.status = 'error';
        state.errorMessage = 'Today could not be loaded.';
      })
      .addCase(refreshHomeHydration.pending, (state) => {
        state.errorMessage = undefined;
      })
      .addCase(
        refreshHomeHydration.fulfilled,
        (
          state,
          action: PayloadAction<{ entries: HydrationEntry[]; healthSyncFailed: boolean }>,
        ) => {
          state.entries = action.payload.entries;
          state.status = 'ready';
        },
      )
      .addCase(refreshHomeHydration.rejected, (state) => {
        state.status = 'error';
        state.errorMessage = 'Today could not be refreshed.';
      })
      .addCase(logHydration.pending, (state) => {
        state.status = 'saving';
        state.errorMessage = undefined;
      })
      .addCase(logHydration.fulfilled, (state, action: PayloadAction<HydrationEntry>) => {
        state.entries.unshift(action.payload);
        state.lastChangedEntry = action.payload;
        state.status = 'ready';
      })
      .addCase(logHydration.rejected, (state) => {
        state.status = 'error';
        state.errorMessage = 'Water could not be logged.';
      })
      .addCase(editHydrationEntry.pending, (state) => {
        state.status = 'saving';
        state.errorMessage = undefined;
      })
      .addCase(editHydrationEntry.fulfilled, (state, action: PayloadAction<HydrationEntry>) => {
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
        state.status = 'error';
        state.errorMessage = 'Entry could not be updated.';
      })
      .addCase(removeHydrationEntry.pending, (state) => {
        state.status = 'saving';
        state.errorMessage = undefined;
      })
      .addCase(removeHydrationEntry.fulfilled, (state, action: PayloadAction<string>) => {
        state.entries = state.entries.filter((entry) => entry.id !== action.payload);
        state.lastChangedEntry = undefined;
        state.status = 'ready';
      })
      .addCase(removeHydrationEntry.rejected, (state) => {
        state.status = 'error';
        state.errorMessage = 'Entry could not be deleted.';
      });
  },
});

export const { clearLastChangedEntry } = hydrationSlice.actions;
export const hydrationReducer = hydrationSlice.reducer;
