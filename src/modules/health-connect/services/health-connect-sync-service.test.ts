import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { HealthConnectSyncStatus } from '../types';
import type { HydrationEntry } from '@modules/hydration/types';
import type { ExternalHydrationRecord } from '@platform/health';

/* eslint-disable @typescript-eslint/no-require-imports */

const mockHealthDataService = {
  getAvailability: jest.fn<() => Promise<string>>(),
  getPermissionState: jest.fn<() => Promise<typeof grantedPermissionState>>(),
  readHydration: jest.fn<() => Promise<ExternalHydrationRecord[]>>(),
  requestPermissions: jest.fn<() => Promise<typeof grantedPermissionState>>(),
  revokeOrDisconnect: jest.fn<() => Promise<void>>(),
  writeHydration: jest.fn<() => Promise<{ recordIds: string[] }>>(),
  deleteHydration: jest.fn<(...args: unknown[]) => Promise<void>>(),
};

const mockAwaitDatabaseReady = jest.fn<() => Promise<object>>();
const mockRefreshHydrationWidgets = jest.fn<() => Promise<void>>();
const mockAddHydrationEntry = jest.fn<() => Promise<void>>();
const mockGetHealthConnectWritableEntries = jest.fn<() => Promise<HydrationEntry[]>>();
const mockHasHydrationEntryForHealthConnectRecord = jest.fn<() => Promise<boolean>>();
const mockMarkHydrationEntriesSyncedToHealthConnect = jest.fn<() => Promise<void>>();
const mockGetHealthConnectDeletions =
  jest.fn<
    () => Promise<
      import('@modules/hydration/repository/hydration-repository').HealthConnectDeletion[]
    >
  >();
const mockMarkHealthConnectDeletionSynced = jest.fn<() => Promise<void>>();

let mockMetadata: {
  lastError?: string;
  lastSyncIso?: string;
  lastSyncStatus: HealthConnectSyncStatus;
};

const mockGetHealthConnectSyncMetadata = jest.fn(() => mockMetadata);
const mockSetHealthConnectSyncError = jest.fn((message: string) => {
  mockMetadata = {
    ...mockMetadata,
    lastError: message,
    lastSyncStatus: 'error',
  };
});
const mockSetHealthConnectSyncSuccess = jest.fn((lastSyncIso: string) => {
  mockMetadata = {
    lastSyncIso,
    lastSyncStatus: 'success',
  };
});

jest.mock('@platform/health', () => ({
  healthDataService: mockHealthDataService,
}));

jest.mock('@platform/database', () => ({
  awaitDatabaseReady: mockAwaitDatabaseReady,
}));

jest.mock('@modules/widgets', () => ({
  refreshHydrationWidgets: mockRefreshHydrationWidgets,
}));

jest.mock('@modules/hydration/repository/hydration-repository', () => ({
  addHydrationEntry: mockAddHydrationEntry,
  getHealthConnectWritableEntries: mockGetHealthConnectWritableEntries,
  hasHydrationEntryForHealthConnectRecord: mockHasHydrationEntryForHealthConnectRecord,
  markHydrationEntriesSyncedToHealthConnect: mockMarkHydrationEntriesSyncedToHealthConnect,
  getHealthConnectDeletions: mockGetHealthConnectDeletions,
  markHealthConnectDeletionSynced: mockMarkHealthConnectDeletionSynced,
}));

jest.mock('../storage/health-connect-storage', () => ({
  clearHealthConnectSyncMetadata: jest.fn(),
  getHealthConnectSyncMetadata: mockGetHealthConnectSyncMetadata,
  setHealthConnectSyncError: mockSetHealthConnectSyncError,
  setHealthConnectSyncSuccess: mockSetHealthConnectSyncSuccess,
}));

jest.mock('@core/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@platform/telemetry', () => ({
  trackEventSafely: jest.fn(),
}));

const {
  connectHealthConnect,
  disconnectHealthConnect,
  getFriendlyHealthConnectSyncError,
  queueBestEffortHealthConnectSync,
  syncHealthConnect,
  syncHealthConnectIfConnected,
} = require('./health-connect-sync-service') as typeof import('./health-connect-sync-service');
const { trackEventSafely: mockTrackEventSafely } =
  require('@platform/telemetry') as typeof import('@platform/telemetry');

const grantedPermissionState = {
  canRequest: true,
  granted: true,
  readGranted: true,
  writeGranted: true,
};

const createDeferred = <T>() => {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
};

const configureSuccessfulSync = () => {
  mockHealthDataService.getAvailability.mockResolvedValue('available');
  mockHealthDataService.getPermissionState.mockResolvedValue(grantedPermissionState);
  mockHealthDataService.requestPermissions.mockResolvedValue(grantedPermissionState);
  mockHealthDataService.writeHydration.mockResolvedValue({ recordIds: [] });
  mockHealthDataService.readHydration.mockResolvedValue([]);
  mockHealthDataService.deleteHydration.mockResolvedValue();
  mockGetHealthConnectDeletions.mockResolvedValue([]);
  mockMarkHealthConnectDeletionSynced.mockResolvedValue();
  mockAwaitDatabaseReady.mockResolvedValue({});
  mockGetHealthConnectWritableEntries.mockResolvedValue([]);
  mockMarkHydrationEntriesSyncedToHealthConnect.mockResolvedValue(undefined);
  mockRefreshHydrationWidgets.mockResolvedValue(undefined);
};

describe('Health Connect sync service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetadata = {
      lastSyncStatus: 'idle',
    };
    configureSuccessfulSync();
  });

  it('deletes an exported drink before importing and suppresses a stale deleted record', async () => {
    mockGetHealthConnectDeletions.mockResolvedValue([
      {
        entryId: 'widget_deleted',
        recordId: 'remote-deleted',
        clientRecordId: 'widget_deleted',
        deleteRemote: 1,
        pending: 1,
      },
    ]);
    mockHealthDataService.readHydration.mockResolvedValue([
      {
        amountMl: 250,
        clientRecordId: 'widget_deleted',
        healthConnectRecordId: 'remote-deleted',
        startTime: '2026-10-08T08:00:00.000Z',
        endTime: '2026-10-08T08:01:00.000Z',
      },
    ]);
    mockHasHydrationEntryForHealthConnectRecord.mockResolvedValue(false);

    const result = await syncHealthConnect();

    expect(mockHealthDataService.deleteHydration).toHaveBeenCalledWith(
      ['remote-deleted'],
      ['widget_deleted'],
    );
    expect(mockMarkHealthConnectDeletionSynced).toHaveBeenCalledWith('widget_deleted');
    expect(mockAddHydrationEntry).not.toHaveBeenCalled();
    expect(result.skippedCount).toBe(1);
  });

  it('keeps a deletion pending when Health Connect fails so it can retry', async () => {
    mockGetHealthConnectDeletions.mockResolvedValue([
      {
        entryId: 'deleted',
        recordId: null,
        clientRecordId: 'deleted',
        deleteRemote: 1,
        pending: 1,
      },
    ]);
    mockHealthDataService.deleteHydration.mockRejectedValueOnce(new Error('offline'));
    await expect(syncHealthConnect()).rejects.toThrow('offline');
    expect(mockMarkHealthConnectDeletionSynced).not.toHaveBeenCalled();
    await syncHealthConnect();
    expect(mockHealthDataService.deleteHydration).toHaveBeenCalledTimes(2);
    expect(mockMarkHealthConnectDeletionSynced).toHaveBeenCalledWith('deleted');
  });

  it('removes a drink deleted while its export is still running', async () => {
    const write = createDeferred<{ recordIds: string[] }>();
    const started = createDeferred<void>();
    mockHealthDataService.writeHydration.mockImplementationOnce(() => {
      started.resolve();
      return write.promise;
    });
    const sync = syncHealthConnect();
    await started.promise;
    mockGetHealthConnectDeletions.mockResolvedValue([
      {
        entryId: 'in-flight',
        recordId: null,
        clientRecordId: 'in-flight',
        deleteRemote: 1,
        pending: 1,
      },
    ]);
    write.resolve({ recordIds: ['new-remote'] });
    await sync;
    expect(mockHealthDataService.deleteHydration).toHaveBeenCalledWith([], ['in-flight']);
  });

  it('does not remotely delete data owned by another app', async () => {
    mockGetHealthConnectDeletions.mockResolvedValue([
      {
        entryId: 'imported',
        recordId: 'external',
        clientRecordId: null,
        deleteRemote: 0,
        pending: 1,
      },
    ]);
    await syncHealthConnect();
    expect(mockHealthDataService.deleteHydration).not.toHaveBeenCalled();
  });

  it('exports edited drinks with a higher version and only acknowledges that snapshot', async () => {
    const updatedAt = '2026-10-08T09:00:00.000Z';
    mockGetHealthConnectWritableEntries.mockResolvedValueOnce([
      {
        id: 'edited',
        amount: 500,
        source: 'edit',
        timestamp: '2026-10-08T08:00:00.000Z',
        createdAt: '2026-10-08T08:00:00.000Z',
        updatedAt,
        healthConnectRecordId: 'remote',
      },
    ]);
    mockHealthDataService.writeHydration.mockResolvedValueOnce({ recordIds: ['remote'] });
    await syncHealthConnect();
    expect(mockHealthDataService.writeHydration).toHaveBeenCalledWith([
      expect.objectContaining({
        clientRecordId: 'edited',
        clientRecordVersion: Date.parse(updatedAt),
        amountMl: 500,
      }),
    ]);
    expect(mockMarkHydrationEntriesSyncedToHealthConnect).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'edited', exportedUpdatedAt: updatedAt }),
    ]);
  });

  it('waits for database readiness before the first sync after connect', async () => {
    const callOrder: string[] = [];

    mockAwaitDatabaseReady.mockImplementation(async () => {
      callOrder.push('database_ready');
      return {};
    });
    mockGetHealthConnectWritableEntries.mockImplementation(async () => {
      callOrder.push('repository_read');
      return [];
    });

    await connectHealthConnect();

    expect(mockHealthDataService.requestPermissions).toHaveBeenCalledTimes(1);
    expect(mockAwaitDatabaseReady).toHaveBeenCalled();
    expect(callOrder).toEqual(['database_ready', 'repository_read']);
    expect(mockTrackEventSafely).toHaveBeenCalledWith('health_connect_connected', {
      connected: true,
      source: 'app',
    });
  });

  it('tracks successful Health Connect connect only after permission is granted', async () => {
    await connectHealthConnect();

    expect(mockTrackEventSafely).toHaveBeenCalledWith('health_connect_connected', {
      connected: true,
      source: 'app',
    });

    jest.clearAllMocks();
    mockHealthDataService.getPermissionState.mockResolvedValue({
      ...grantedPermissionState,
      granted: false,
      readGranted: false,
      writeGranted: false,
    });

    await expect(connectHealthConnect()).resolves.toBeUndefined();

    expect(mockTrackEventSafely).not.toHaveBeenCalledWith('health_connect_connected', {
      connected: true,
      source: 'app',
    });
  });

  it('tracks successful Health Connect disconnect only after revoke succeeds', async () => {
    await disconnectHealthConnect();

    expect(mockHealthDataService.revokeOrDisconnect).toHaveBeenCalledTimes(1);
    expect(mockTrackEventSafely).toHaveBeenCalledWith('health_connect_disconnected', {
      connected: false,
      source: 'app',
    });

    jest.clearAllMocks();
    mockHealthDataService.revokeOrDisconnect.mockRejectedValueOnce(new Error('Revoke failed'));

    await expect(disconnectHealthConnect()).rejects.toThrow('Revoke failed');
    expect(mockTrackEventSafely).not.toHaveBeenCalledWith('health_connect_disconnected', {
      connected: false,
      source: 'app',
    });
  });

  it('waits for migrations through database readiness before repository access', async () => {
    const callOrder: string[] = [];

    mockAwaitDatabaseReady.mockImplementation(async () => {
      callOrder.push('migrations_complete');
      return {};
    });
    mockGetHealthConnectWritableEntries.mockImplementation(async () => {
      callOrder.push('repository_ready');
      return [];
    });

    await syncHealthConnect();

    expect(callOrder).toEqual(['migrations_complete', 'repository_ready']);
  });

  it('does not start duplicate syncs for connect and concurrent refresh callers', async () => {
    const databaseReady = createDeferred<object>();
    mockAwaitDatabaseReady.mockReturnValue(databaseReady.promise);

    const connectPromise = connectHealthConnect();
    const refreshPromise = syncHealthConnect();

    databaseReady.resolve({});
    await Promise.all([connectPromise, refreshPromise]);

    expect(mockHealthDataService.writeHydration).toHaveBeenCalledTimes(1);
    expect(mockHealthDataService.readHydration).toHaveBeenCalledTimes(1);
  });

  it('queues overlapping manual sync work while initialization is still pending', async () => {
    const databaseReady = createDeferred<object>();
    mockAwaitDatabaseReady.mockReturnValue(databaseReady.promise);

    const firstSync = syncHealthConnect();
    const secondSync = syncHealthConnect();

    databaseReady.resolve({});
    await Promise.all([firstSync, secondSync]);

    expect(mockAwaitDatabaseReady).toHaveBeenCalledTimes(1);
    expect(mockGetHealthConnectWritableEntries).toHaveBeenCalledTimes(1);
    expect(mockHealthDataService.writeHydration).toHaveBeenCalledTimes(1);
  });

  it('stores friendly copy when database initialization fails', async () => {
    mockAwaitDatabaseReady.mockRejectedValue(new Error('NativeDatabase.prepareAsync failed'));

    await expect(syncHealthConnect()).rejects.toThrow('NativeDatabase.prepareAsync failed');

    expect(mockSetHealthConnectSyncError).toHaveBeenCalledWith(
      'Health sync is temporarily unavailable. Try again.',
    );
    expect(mockMetadata.lastError).toBe('Health sync is temporarily unavailable. Try again.');
  });

  it('clears a previous transient error after a successful retry', async () => {
    mockAwaitDatabaseReady.mockRejectedValueOnce(new Error('NativeDatabase.prepareAsync failed'));
    await expect(syncHealthConnect()).rejects.toThrow('NativeDatabase.prepareAsync failed');

    mockAwaitDatabaseReady.mockResolvedValueOnce({});
    await syncHealthConnect();

    expect(mockMetadata.lastError).toBeUndefined();
    expect(mockMetadata.lastSyncStatus).toBe('success');
  });

  it('does not expose raw native exceptions in production UI metadata', () => {
    const friendlyMessage = getFriendlyHealthConnectSyncError(
      new Error(
        "Call to function 'NativeDatabase.prepareAsync' has been rejected. Caused by: java.lang.NullPointerException",
      ),
    );

    expect(friendlyMessage).toBe('Health sync is temporarily unavailable. Try again.');
    expect(friendlyMessage).not.toContain('NativeDatabase');
    expect(friendlyMessage).not.toContain('NullPointerException');
  });

  it('releases the sync lock in finally after failures', async () => {
    mockHealthDataService.writeHydration.mockRejectedValueOnce(new Error('Write failed.'));

    await expect(syncHealthConnect()).rejects.toThrow('Write failed.');

    mockHealthDataService.writeHydration.mockResolvedValueOnce({ recordIds: [] });
    await syncHealthConnect();

    expect(mockHealthDataService.writeHydration).toHaveBeenCalledTimes(2);
  });

  it('skips optional sync when Health Connect is disconnected', async () => {
    mockHealthDataService.getPermissionState.mockResolvedValue({
      ...grantedPermissionState,
      granted: false,
      readGranted: false,
      writeGranted: false,
    });

    await expect(syncHealthConnectIfConnected()).resolves.toBeUndefined();

    expect(mockAwaitDatabaseReady).not.toHaveBeenCalled();
    expect(mockHealthDataService.writeHydration).not.toHaveBeenCalled();
  });

  it('coalesces rapid automatic sync requests after local hydration additions', async () => {
    jest.useFakeTimers();

    try {
      const firstSync = queueBestEffortHealthConnectSync();
      const secondSync = queueBestEffortHealthConnectSync();

      jest.runOnlyPendingTimers();
      await Promise.all([firstSync, secondSync]);

      expect(mockHealthDataService.writeHydration).toHaveBeenCalledTimes(1);
      expect(mockHealthDataService.readHydration).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not reject local mutation follow-up work when automatic sync fails', async () => {
    jest.useFakeTimers();
    mockHealthDataService.writeHydration.mockRejectedValueOnce(new Error('Write failed.'));

    try {
      const sync = queueBestEffortHealthConnectSync();

      jest.runOnlyPendingTimers();

      await expect(sync).resolves.toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('runs another sync for a widget drink committed during an ongoing export', async () => {
    jest.useFakeTimers();
    const write = createDeferred<{ recordIds: string[] }>();
    mockHealthDataService.writeHydration.mockReturnValueOnce(write.promise);
    try {
      const first = queueBestEffortHealthConnectSync();
      await jest.runOnlyPendingTimersAsync();
      expect(mockHealthDataService.writeHydration).toHaveBeenCalledTimes(1);
      const second = queueBestEffortHealthConnectSync();
      write.resolve({ recordIds: [] });
      await Promise.all([first, second]);
      expect(mockHealthDataService.writeHydration).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('exports a widget drink once and does not reimport it on repeated syncs', async () => {
    const timestamp = '2026-10-07T08:00:00.000Z';
    mockGetHealthConnectWritableEntries.mockResolvedValueOnce([
      {
        id: 'widget_drink',
        amount: 350,
        source: 'widget',
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]);
    mockHealthDataService.writeHydration.mockResolvedValueOnce({ recordIds: ['health-drink'] });
    mockHealthDataService.readHydration.mockResolvedValue([
      {
        amountMl: 350,
        clientRecordId: 'widget_drink',
        healthConnectRecordId: 'health-drink',
        startTime: timestamp,
        endTime: '2026-10-07T08:01:00.000Z',
      },
    ]);
    mockHasHydrationEntryForHealthConnectRecord.mockResolvedValue(true);

    await expect(syncHealthConnect()).resolves.toEqual({
      writtenCount: 1,
      importedCount: 0,
      skippedCount: 1,
    });
    await expect(syncHealthConnect()).resolves.toEqual({
      writtenCount: 0,
      importedCount: 0,
      skippedCount: 1,
    });
    expect(mockAddHydrationEntry).not.toHaveBeenCalled();
    expect(mockMarkHydrationEntriesSyncedToHealthConnect).toHaveBeenNthCalledWith(1, [
      {
        healthConnectRecordId: 'health-drink',
        id: 'widget_drink',
        syncedAt: expect.any(String),
        exportedUpdatedAt: timestamp,
        exportedClientRecordId: 'widget_drink',
      },
    ]);
  });
});
