import {
  SdkAvailabilityStatus,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  insertRecords,
  readRecords,
  requestPermission,
  revokeAllPermissions,
  type HealthConnectRecord,
  type Permission,
} from 'react-native-health-connect';

import type {
  ExternalHydrationRecord,
  HealthDataAvailability,
  HealthDataPermissionState,
  HealthDataService,
  HealthWriteResult,
  HydrationWriteRecord,
  ReadHydrationOptions,
} from './health-data-types';

const hydrationPermissions: Permission[] = [
  { accessType: 'read', recordType: 'Hydration' },
  { accessType: 'write', recordType: 'Hydration' },
];

const hasPermission = (permissions: readonly Permission[], expected: Permission): boolean => {
  return permissions.some(
    (permission) =>
      permission.accessType === expected.accessType &&
      permission.recordType === expected.recordType,
  );
};

const toPermissionState = (permissions: readonly Permission[]): HealthDataPermissionState => {
  const readGranted = hasPermission(permissions, hydrationPermissions[0]);
  const writeGranted = hasPermission(permissions, hydrationPermissions[1]);

  return {
    canRequest: true,
    granted: readGranted && writeGranted,
    readGranted,
    writeGranted,
  };
};

const unavailablePermissionState: HealthDataPermissionState = {
  canRequest: false,
  granted: false,
  readGranted: false,
  writeGranted: false,
};

const isNativeModuleUnavailableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("doesn't seem to be linked") ||
    error.message.includes('is not available') ||
    error.message.includes('NativeModule') ||
    error.message.includes('not linked')
  );
};

const ensureInitialized = async (): Promise<boolean> => {
  const availability = await healthDataService.getAvailability();

  if (availability !== 'available') {
    return false;
  }

  try {
    return await initialize();
  } catch (error) {
    if (isNativeModuleUnavailableError(error)) {
      return false;
    }

    throw error;
  }
};

export const healthDataService: HealthDataService = {
  getAvailability: async (): Promise<HealthDataAvailability> => {
    let status: Awaited<ReturnType<typeof getSdkStatus>>;

    try {
      status = await getSdkStatus();
    } catch (error) {
      if (isNativeModuleUnavailableError(error)) {
        return 'unavailable';
      }

      throw error;
    }

    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
      return 'available';
    }

    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return 'provider_update_required';
    }

    return 'unavailable';
  },

  getPermissionState: async (): Promise<HealthDataPermissionState> => {
    const initialized = await ensureInitialized();

    if (!initialized) {
      return unavailablePermissionState;
    }

    try {
      const permissions = (await getGrantedPermissions()).filter(
        (permission): permission is Permission => 'recordType' in permission,
      );

      return toPermissionState(permissions);
    } catch (error) {
      if (isNativeModuleUnavailableError(error)) {
        return unavailablePermissionState;
      }

      throw error;
    }
  },

  requestPermissions: async (): Promise<HealthDataPermissionState> => {
    const initialized = await ensureInitialized();

    if (!initialized) {
      return unavailablePermissionState;
    }

    try {
      const permissions = (await requestPermission(hydrationPermissions)).filter(
        (permission): permission is Permission => 'recordType' in permission,
      );

      return toPermissionState(permissions);
    } catch (error) {
      if (isNativeModuleUnavailableError(error)) {
        return unavailablePermissionState;
      }

      throw error;
    }
  },

  readHydration: async ({
    endTime,
    startTime,
  }: ReadHydrationOptions): Promise<ExternalHydrationRecord[]> => {
    const initialized = await ensureInitialized();

    if (!initialized) {
      return [];
    }

    let records: Awaited<ReturnType<typeof readRecords<'Hydration'>>>['records'];

    try {
      const response = await readRecords('Hydration', {
        ascendingOrder: true,
        timeRangeFilter: {
          endTime,
          operator: 'between',
          startTime,
        },
      });
      records = response.records;
    } catch (error) {
      if (isNativeModuleUnavailableError(error)) {
        return [];
      }

      throw error;
    }

    return records
      .filter((record) => record.metadata?.id !== undefined)
      .map((record) => ({
        amountMl: Math.round(record.volume.inMilliliters),
        clientRecordId: record.metadata?.clientRecordId ?? undefined,
        dataOrigin: record.metadata?.dataOrigin ?? undefined,
        endTime: record.endTime,
        healthConnectRecordId: record.metadata?.id ?? '',
        lastModifiedTime: record.metadata?.lastModifiedTime ?? undefined,
        startTime: record.startTime,
      }))
      .filter((record) => record.amountMl > 0 && record.healthConnectRecordId.length > 0);
  },

  revokeOrDisconnect: async (): Promise<void> => {
    try {
      await revokeAllPermissions();
    } catch (error) {
      if (isNativeModuleUnavailableError(error)) {
        return;
      }

      throw error;
    }
  },

  writeHydration: async (records: HydrationWriteRecord[]): Promise<HealthWriteResult> => {
    const initialized = await ensureInitialized();

    if (!initialized || records.length === 0) {
      return { recordIds: [] };
    }

    const healthRecords: HealthConnectRecord[] = records.map((record) => ({
      endTime: record.endTime,
      metadata: {
        clientRecordId: record.clientRecordId,
        recordingMethod: 3,
      },
      recordType: 'Hydration',
      startTime: record.startTime,
      volume: {
        unit: 'milliliters',
        value: record.amountMl,
      },
    }));

    try {
      return {
        recordIds: await insertRecords(healthRecords),
      };
    } catch (error) {
      if (isNativeModuleUnavailableError(error)) {
        return { recordIds: [] };
      }

      throw error;
    }
  },
};
