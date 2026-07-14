import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { HydrationEntry } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports */

const mockAwaitDatabaseReady = jest.fn<() => Promise<object>>();
const mockSyncHealthConnectIfConnected = jest.fn<() => Promise<unknown>>();
const mockRefreshHydrationWidgets = jest.fn<() => Promise<void>>();
const mockGetTodayHydrationEntries = jest.fn<() => Promise<HydrationEntry[]>>();

jest.mock('@platform/database', () => ({
  awaitDatabaseReady: mockAwaitDatabaseReady,
}));

jest.mock('@modules/health-connect/services/health-connect-sync-service', () => ({
  syncHealthConnectIfConnected: mockSyncHealthConnectIfConnected,
}));

jest.mock('@modules/widgets', () => ({
  refreshHydrationWidgets: mockRefreshHydrationWidgets,
}));

jest.mock('../repository/hydration-repository', () => ({
  getTodayHydrationEntries: mockGetTodayHydrationEntries,
}));

const { refreshHomeHydrationFromCanonicalSource } =
  require('./home-refresh-service') as typeof import('./home-refresh-service');

const createEntry = (id: string, amount: number): HydrationEntry => ({
  amount,
  createdAt: '2026-07-14T08:00:00.000Z',
  id,
  source: 'quick_add',
  timestamp: `2026-07-14T08:0${amount / 250}:00.000Z`,
  updatedAt: '2026-07-14T08:00:00.000Z',
});

describe('home hydration refresh service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAwaitDatabaseReady.mockResolvedValue({});
    mockSyncHealthConnectIfConnected.mockResolvedValue(undefined);
    mockRefreshHydrationWidgets.mockResolvedValue(undefined);
  });

  it('pull-to-refresh reloads canonical SQLite data before and after sync', async () => {
    const beforeSync = [createEntry('local-before', 250)];
    const afterSync = [createEntry('canonical-after', 500)];
    mockGetTodayHydrationEntries.mockResolvedValueOnce(beforeSync).mockResolvedValueOnce(afterSync);

    const result = await refreshHomeHydrationFromCanonicalSource();

    expect(mockAwaitDatabaseReady).toHaveBeenCalledTimes(1);
    expect(mockSyncHealthConnectIfConnected).toHaveBeenCalledTimes(1);
    expect(mockGetTodayHydrationEntries).toHaveBeenCalledTimes(2);
    expect(result.entries).toEqual(afterSync);
  });

  it('connected Health Connect performs read/write sync during Home refresh', async () => {
    mockGetTodayHydrationEntries.mockResolvedValue([]);

    await refreshHomeHydrationFromCanonicalSource();

    expect(mockSyncHealthConnectIfConnected).toHaveBeenCalledTimes(1);
  });

  it('disconnected Health Connect still refreshes local Home data', async () => {
    const localEntries = [createEntry('local-only', 750)];
    mockSyncHealthConnectIfConnected.mockResolvedValue(undefined);
    mockGetTodayHydrationEntries.mockResolvedValue(localEntries);

    const result = await refreshHomeHydrationFromCanonicalSource();

    expect(result).toEqual({
      entries: localEntries,
      healthSyncFailed: false,
    });
  });

  it('sync failure preserves local Home data and reports a recoverable sync issue', async () => {
    const localEntries = [createEntry('safe-local', 500)];
    mockSyncHealthConnectIfConnected.mockRejectedValue(new Error('Health failed.'));
    mockGetTodayHydrationEntries.mockResolvedValue(localEntries);

    const result = await refreshHomeHydrationFromCanonicalSource();

    expect(result).toEqual({
      entries: localEntries,
      healthSyncFailed: true,
    });
  });

  it('refreshes widgets after canonical reload from SQLite', async () => {
    const callOrder: string[] = [];
    mockGetTodayHydrationEntries.mockImplementation(async () => {
      callOrder.push('load_sqlite');
      return [createEntry('canonical', 250)];
    });
    mockSyncHealthConnectIfConnected.mockImplementation(async () => {
      callOrder.push('health_sync');
      return undefined;
    });
    mockRefreshHydrationWidgets.mockImplementation(async () => {
      callOrder.push('widget_refresh');
    });

    await refreshHomeHydrationFromCanonicalSource();

    expect(callOrder).toEqual(['load_sqlite', 'health_sync', 'load_sqlite', 'widget_refresh']);
  });

  it('returns updated progress before reminder reevaluation can occur', async () => {
    const afterSync = [createEntry('imported', 1000)];
    mockGetTodayHydrationEntries.mockResolvedValueOnce([]).mockResolvedValueOnce(afterSync);

    const result = await refreshHomeHydrationFromCanonicalSource();

    const secondCanonicalLoadOrder = mockGetTodayHydrationEntries.mock.invocationCallOrder[1];
    const widgetRefreshOrder = mockRefreshHydrationWidgets.mock.invocationCallOrder[0];

    expect(result.entries).toEqual(afterSync);
    expect(secondCanonicalLoadOrder).toBeLessThan(widgetRefreshOrder);
  });
});
