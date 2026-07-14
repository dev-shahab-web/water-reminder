import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { HealthConnectSyncStatus } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports */

const mockHealthDataService = {
  getAvailability: jest.fn<() => Promise<string>>(),
  getPermissionState: jest.fn<() => Promise<typeof grantedPermissionState>>(),
  readHydration: jest.fn<() => Promise<[]>>(),
  requestPermissions: jest.fn<() => Promise<typeof grantedPermissionState>>(),
  revokeOrDisconnect: jest.fn<() => Promise<void>>(),
  writeHydration: jest.fn<() => Promise<{ recordIds: string[] }>>(),
};

const mockAwaitDatabaseReady = jest.fn<() => Promise<object>>();
const mockRefreshHydrationWidgets = jest.fn<() => Promise<void>>();
const mockAddHydrationEntry = jest.fn<() => Promise<void>>();
const mockGetHealthConnectWritableEntries = jest.fn<() => Promise<[]>>();
const mockHasHydrationEntryForHealthConnectRecord = jest.fn<() => Promise<boolean>>();
const mockMarkHydrationEntriesSyncedToHealthConnect = jest.fn<() => Promise<void>>();

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
});
