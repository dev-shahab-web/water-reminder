import { logger } from '@core/logger';
import { healthDataService, type ExternalHydrationRecord } from '@platform/health';
import { awaitDatabaseReady } from '@platform/database';
import { refreshHydrationWidgets } from '@modules/widgets';
import {
  addHydrationEntry,
  getHealthConnectWritableEntries,
  hasHydrationEntryForHealthConnectRecord,
  markHydrationEntriesSyncedToHealthConnect,
} from '@modules/hydration/repository/hydration-repository';

import {
  clearHealthConnectSyncMetadata,
  getHealthConnectSyncMetadata,
  setHealthConnectSyncError,
  setHealthConnectSyncSuccess,
} from '../storage/health-connect-storage';
import type { HealthConnectState, HealthConnectSyncResult } from '../types';

const initialSyncWindowDays = 365;
const friendlySyncUnavailableMessage = 'Health sync is temporarily unavailable. Try again.';
const bestEffortSyncDelayMs = 500;

let activeSyncPromise: Promise<HealthConnectSyncResult> | null = null;
let queuedBestEffortSyncPromise: Promise<void> | null = null;

const getDefaultPermissionState = () => ({
  canRequest: false,
  granted: false,
  readGranted: false,
  writeGranted: false,
});

const getSyncStartIso = (lastSyncIso?: string): string => {
  const start = new Date(lastSyncIso ?? Date.now() - initialSyncWindowDays * 24 * 60 * 60 * 1000);

  if (lastSyncIso !== undefined) {
    start.setDate(start.getDate() - 1);
  }

  return start.toISOString();
};

const getEndTimeForEntry = (timestamp: string): string => {
  return new Date(new Date(timestamp).getTime() + 60 * 1000).toISOString();
};

const getImportedId = (record: ExternalHydrationRecord): string => {
  return `health_connect_${record.healthConnectRecordId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
};

export const getHealthConnectState = async (): Promise<HealthConnectState> => {
  const availability = await healthDataService.getAvailability();
  const permissionState =
    availability === 'available'
      ? await healthDataService.getPermissionState()
      : getDefaultPermissionState();
  const metadata = getHealthConnectSyncMetadata();

  return {
    availability,
    lastError: metadata.lastError,
    lastSyncIso: metadata.lastSyncIso,
    lastSyncStatus: metadata.lastSyncStatus,
    permissionState,
  };
};

export const requestHealthConnectPermissions = async (): Promise<HealthConnectState> => {
  const availability = await healthDataService.getAvailability();

  if (availability !== 'available') {
    return getHealthConnectState();
  }

  await healthDataService.requestPermissions();

  return getHealthConnectState();
};

export const connectHealthConnect = async (): Promise<HealthConnectSyncResult | undefined> => {
  const state = await requestHealthConnectPermissions();

  if (!state.permissionState.granted) {
    return undefined;
  }

  await awaitDatabaseReady();
  return syncHealthConnectWithReadyDatabase();
};

export const disconnectHealthConnect = async (): Promise<HealthConnectState> => {
  await healthDataService.revokeOrDisconnect();
  clearHealthConnectSyncMetadata();

  return getHealthConnectState();
};

export const syncHealthConnect = async (): Promise<HealthConnectSyncResult> => {
  return runExclusiveHealthConnectSync({ awaitDatabaseReadiness: true });
};

export const syncHealthConnectIfConnected = async (): Promise<
  HealthConnectSyncResult | undefined
> => {
  const state = await getHealthConnectState();

  if (state.availability !== 'available' || !state.permissionState.granted) {
    return undefined;
  }

  return syncHealthConnect();
};

export const queueBestEffortHealthConnectSync = (): Promise<void> => {
  if (queuedBestEffortSyncPromise) {
    return queuedBestEffortSyncPromise;
  }

  queuedBestEffortSyncPromise = new Promise((resolve) => {
    setTimeout(() => {
      void syncHealthConnectIfConnected()
        .catch((error: unknown) => {
          logHealthConnectSyncError(error);
        })
        .finally(() => {
          queuedBestEffortSyncPromise = null;
          resolve();
        });
    }, bestEffortSyncDelayMs);
  });

  return queuedBestEffortSyncPromise;
};

const syncHealthConnectWithReadyDatabase = async (): Promise<HealthConnectSyncResult> => {
  return runExclusiveHealthConnectSync({ awaitDatabaseReadiness: false });
};

const runExclusiveHealthConnectSync = async ({
  awaitDatabaseReadiness,
}: {
  awaitDatabaseReadiness: boolean;
}): Promise<HealthConnectSyncResult> => {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = performHealthConnectSync({ awaitDatabaseReadiness });

  try {
    return await activeSyncPromise;
  } finally {
    activeSyncPromise = null;
  }
};

const performHealthConnectSync = async ({
  awaitDatabaseReadiness,
}: {
  awaitDatabaseReadiness: boolean;
}): Promise<HealthConnectSyncResult> => {
  try {
    const state = await getHealthConnectState();

    if (state.availability !== 'available') {
      throw new Error('Health Connect is not available.');
    }

    if (!state.permissionState.granted) {
      throw new Error('Health Connect hydration permission is not granted.');
    }

    if (awaitDatabaseReadiness) {
      await awaitDatabaseReady();
    }

    const nowIso = new Date().toISOString();
    const localEntries = await getHealthConnectWritableEntries();
    const writableRecords = localEntries.map((entry) => ({
      amountMl: entry.amount,
      clientRecordId: entry.id,
      endTime: getEndTimeForEntry(entry.timestamp),
      startTime: entry.timestamp,
    }));
    const writeResult = await healthDataService.writeHydration(writableRecords);
    await markHydrationEntriesSyncedToHealthConnect(
      writeResult.recordIds
        .map((healthConnectRecordId, index) => ({
          healthConnectRecordId,
          id: localEntries[index]?.id ?? '',
          syncedAt: nowIso,
        }))
        .filter((update) => update.id.length > 0),
    );

    const externalRecords = await healthDataService.readHydration({
      endTime: nowIso,
      startTime: getSyncStartIso(state.lastSyncIso),
    });
    let importedCount = 0;
    let skippedCount = 0;

    for (const record of externalRecords) {
      const alreadyExists = await hasHydrationEntryForHealthConnectRecord({
        clientRecordId: record.clientRecordId,
        healthConnectRecordId: record.healthConnectRecordId,
      });

      if (alreadyExists) {
        skippedCount += 1;
        continue;
      }

      await addHydrationEntry({
        amount: record.amountMl,
        healthConnectClientRecordId: record.clientRecordId,
        healthConnectDataOrigin: record.dataOrigin,
        healthConnectRecordId: record.healthConnectRecordId,
        healthConnectSyncedAt: nowIso,
        id: getImportedId(record),
        source: 'health_connect',
        timestamp: record.startTime,
      });
      importedCount += 1;
    }

    setHealthConnectSyncSuccess(nowIso);
    await refreshHydrationWidgets('health_connect_sync');

    return {
      importedCount,
      skippedCount,
      writtenCount: writeResult.recordIds.length,
    };
  } catch (error) {
    setHealthConnectSyncError(getFriendlyHealthConnectSyncError(error));
    logHealthConnectSyncError(error);
    throw error;
  }
};

export const getFriendlyHealthConnectSyncError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';

  if (message === 'Health Connect is not available.') {
    return 'Health Connect is not available on this device.';
  }

  if (message === 'Health Connect hydration permission is not granted.') {
    return 'Hydration permission is needed to sync.';
  }

  return friendlySyncUnavailableMessage;
};

const logHealthConnectSyncError = (error: unknown): void => {
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('Health Connect sync failed.', { error });
  }
};
