import type { HealthDataAvailability, HealthDataPermissionState } from '@platform/health';

export type HealthConnectSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type HealthConnectState = {
  availability: HealthDataAvailability;
  lastError?: string;
  lastSyncIso?: string;
  lastSyncStatus: HealthConnectSyncStatus;
  permissionState: HealthDataPermissionState;
};

export type HealthConnectSyncResult = {
  importedCount: number;
  skippedCount: number;
  writtenCount: number;
};
