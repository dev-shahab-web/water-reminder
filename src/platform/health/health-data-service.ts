import type {
  ExternalHydrationRecord,
  HealthDataAvailability,
  HealthDataPermissionState,
  HealthDataService,
  HealthWriteResult,
  HydrationWriteRecord,
  ReadHydrationOptions,
} from './health-data-types';

const unsupportedPermissionState: HealthDataPermissionState = {
  canRequest: false,
  granted: false,
  readGranted: false,
  writeGranted: false,
};

export const healthDataService: HealthDataService = {
  getAvailability: async (): Promise<HealthDataAvailability> => 'unsupported',
  getPermissionState: async (): Promise<HealthDataPermissionState> => unsupportedPermissionState,
  readHydration: async (_options: ReadHydrationOptions): Promise<ExternalHydrationRecord[]> => [],
  requestPermissions: async (): Promise<HealthDataPermissionState> => unsupportedPermissionState,
  revokeOrDisconnect: async (): Promise<void> => {},
  writeHydration: async (_records: HydrationWriteRecord[]): Promise<HealthWriteResult> => ({
    recordIds: [],
  }),
};
