import { getStorage } from '@platform/storage';

export const telemetryConsentStorageKeys = {
  shareAnonymousDiagnostics: 'telemetryShareAnonymousDiagnostics',
} as const;

export const defaultTelemetryEnabled = false;

let cachedTelemetryEnabled: boolean | undefined;

export const isTelemetryEnabled = (): boolean => {
  if (cachedTelemetryEnabled !== undefined) {
    return cachedTelemetryEnabled;
  }

  cachedTelemetryEnabled =
    getStorage().getBoolean(telemetryConsentStorageKeys.shareAnonymousDiagnostics) ??
    defaultTelemetryEnabled;

  return cachedTelemetryEnabled;
};

export const setTelemetryConsent = (enabled: boolean): boolean => {
  getStorage().set(telemetryConsentStorageKeys.shareAnonymousDiagnostics, enabled);
  cachedTelemetryEnabled = enabled;
  return enabled;
};
