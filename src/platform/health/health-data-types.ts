export type HealthDataAvailability =
  'available' | 'provider_update_required' | 'unavailable' | 'unsupported';

export type HealthDataPermissionState = {
  canRequest: boolean;
  granted: boolean;
  readGranted: boolean;
  writeGranted: boolean;
};

export type ReadHydrationOptions = {
  endTime: string;
  startTime: string;
};

export type ExternalHydrationRecord = {
  amountMl: number;
  clientRecordId?: string;
  dataOrigin?: string;
  endTime: string;
  healthConnectRecordId: string;
  lastModifiedTime?: string;
  startTime: string;
};

export type HydrationWriteRecord = {
  amountMl: number;
  clientRecordId: string;
  endTime: string;
  startTime: string;
};

export type HealthWriteResult = {
  recordIds: string[];
};

export type HealthDataService = {
  getAvailability: () => Promise<HealthDataAvailability>;
  getPermissionState: () => Promise<HealthDataPermissionState>;
  requestPermissions: () => Promise<HealthDataPermissionState>;
  readHydration: (options: ReadHydrationOptions) => Promise<ExternalHydrationRecord[]>;
  writeHydration: (records: HydrationWriteRecord[]) => Promise<HealthWriteResult>;
  revokeOrDisconnect: () => Promise<void>;
};
