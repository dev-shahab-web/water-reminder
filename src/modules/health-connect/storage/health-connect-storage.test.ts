import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  clearHealthConnectSyncMetadata,
  getHealthConnectSyncMetadata,
  healthConnectStorageKeys,
  setHealthConnectSyncError,
  setHealthConnectSyncSuccess,
} from './health-connect-storage';

const mockStorageValues = new Map<string, boolean | number | string>();

jest.mock('@platform/storage', () => ({
  getStorage: () => ({
    getString: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'string' ? value : undefined;
    },
    remove: (key: string) => {
      mockStorageValues.delete(key);
    },
    set: (key: string, value: boolean | number | string) => {
      mockStorageValues.set(key, value);
    },
  }),
}));

describe('Health Connect storage', () => {
  beforeEach(() => {
    mockStorageValues.clear();
  });

  it('returns idle metadata when no sync has run', () => {
    expect(getHealthConnectSyncMetadata()).toEqual({
      lastError: undefined,
      lastSyncIso: undefined,
      lastSyncStatus: 'idle',
    });
  });

  it('persists successful sync metadata and clears stale errors', () => {
    setHealthConnectSyncError('Permission was removed.');
    setHealthConnectSyncSuccess('2026-07-12T10:00:00.000Z');

    expect(mockStorageValues.get(healthConnectStorageKeys.lastSyncIso)).toBe(
      '2026-07-12T10:00:00.000Z',
    );
    expect(mockStorageValues.get(healthConnectStorageKeys.lastSyncStatus)).toBe('success');
    expect(mockStorageValues.has(healthConnectStorageKeys.lastError)).toBe(false);
    expect(getHealthConnectSyncMetadata()).toEqual({
      lastError: undefined,
      lastSyncIso: '2026-07-12T10:00:00.000Z',
      lastSyncStatus: 'success',
    });
  });

  it('persists recoverable sync errors without clearing last successful sync time', () => {
    setHealthConnectSyncSuccess('2026-07-12T10:00:00.000Z');
    setHealthConnectSyncError('Health Connect is unavailable.');

    expect(getHealthConnectSyncMetadata()).toEqual({
      lastError: 'Health Connect is unavailable.',
      lastSyncIso: '2026-07-12T10:00:00.000Z',
      lastSyncStatus: 'error',
    });
  });

  it('clears Health Connect metadata on disconnect', () => {
    setHealthConnectSyncSuccess('2026-07-12T10:00:00.000Z');
    setHealthConnectSyncError('Permission was removed.');
    clearHealthConnectSyncMetadata();

    expect(getHealthConnectSyncMetadata()).toEqual({
      lastError: undefined,
      lastSyncIso: undefined,
      lastSyncStatus: 'idle',
    });
  });
});
