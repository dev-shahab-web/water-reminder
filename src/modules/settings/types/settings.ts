export const MEASUREMENT_UNITS = ['ml', 'oz'] as const;
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export type SettingsState = {
  measurementUnit: MeasurementUnit;
  reduceMotion: boolean;
  shareAnonymousDiagnostics: boolean;
  startOfDay: string;
  themePreference: ThemePreference;
};

export type HydrationDataExportEntry = {
  amount: number;
  createdAt: string;
  healthConnectClientRecordId?: string;
  healthConnectDataOrigin?: string;
  healthConnectRecordId?: string;
  healthConnectSyncedAt?: string;
  id: string;
  source: string;
  timestamp: string;
  updatedAt: string;
};

export type HydrationDataExport = {
  entries: HydrationDataExportEntry[];
  exportedAt: string;
  schemaVersion: 1;
  source: 'water-reminder';
};
