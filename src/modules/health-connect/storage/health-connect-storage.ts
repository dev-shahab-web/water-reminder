import { getStorage } from '@platform/storage';

import type { HealthConnectSyncStatus } from '../types';

export const healthConnectStorageKeys = {
  lastError: 'healthConnectLastError',
  lastSyncIso: 'healthConnectLastSyncIso',
  lastSyncStatus: 'healthConnectLastSyncStatus',
} as const;

const isSyncStatus = (value: string | undefined): value is HealthConnectSyncStatus => {
  return value === 'idle' || value === 'syncing' || value === 'success' || value === 'error';
};

export const getHealthConnectSyncMetadata = (): {
  lastError?: string;
  lastSyncIso?: string;
  lastSyncStatus: HealthConnectSyncStatus;
} => {
  const storage = getStorage();
  const lastSyncStatus = storage.getString(healthConnectStorageKeys.lastSyncStatus);

  return {
    lastError: storage.getString(healthConnectStorageKeys.lastError),
    lastSyncIso: storage.getString(healthConnectStorageKeys.lastSyncIso),
    lastSyncStatus: isSyncStatus(lastSyncStatus) ? lastSyncStatus : 'idle',
  };
};

export const setHealthConnectSyncSuccess = (lastSyncIso: string): void => {
  const storage = getStorage();

  storage.set(healthConnectStorageKeys.lastSyncIso, lastSyncIso);
  storage.set(healthConnectStorageKeys.lastSyncStatus, 'success');
  storage.remove(healthConnectStorageKeys.lastError);
};

export const setHealthConnectSyncError = (message: string): void => {
  const storage = getStorage();

  storage.set(healthConnectStorageKeys.lastSyncStatus, 'error');
  storage.set(healthConnectStorageKeys.lastError, message);
};

export const clearHealthConnectSyncMetadata = (): void => {
  const storage = getStorage();

  storage.remove(healthConnectStorageKeys.lastError);
  storage.remove(healthConnectStorageKeys.lastSyncIso);
  storage.set(healthConnectStorageKeys.lastSyncStatus, 'idle');
};
