import { healthDataService, type ExternalHydrationRecord } from '@platform/health';
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

export const disconnectHealthConnect = async (): Promise<HealthConnectState> => {
  await healthDataService.revokeOrDisconnect();
  clearHealthConnectSyncMetadata();

  return getHealthConnectState();
};

export const syncHealthConnect = async (): Promise<HealthConnectSyncResult> => {
  try {
    const state = await getHealthConnectState();

    if (state.availability !== 'available') {
      throw new Error('Health Connect is not available.');
    }

    if (!state.permissionState.granted) {
      throw new Error('Health Connect hydration permission is not granted.');
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
    void refreshHydrationWidgets('health_connect_sync');

    return {
      importedCount,
      skippedCount,
      writtenCount: writeResult.recordIds.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health Connect sync failed.';
    setHealthConnectSyncError(message);
    throw error;
  }
};
