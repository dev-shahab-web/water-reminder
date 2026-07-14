import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/* eslint-disable @typescript-eslint/no-require-imports */

const mockStorageValues = new Map<string, boolean | number | string>();

jest.mock('@platform/storage', () => ({
  getStorage: () => ({
    getBoolean: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'boolean' ? value : undefined;
    },
    set: (key: string, value: boolean | number | string) => {
      mockStorageValues.set(key, value);
    },
  }),
}));

const { isTelemetryEnabled, setTelemetryConsent, telemetryConsentStorageKeys } =
  require('./telemetry-consent') as typeof import('./telemetry-consent');

describe('telemetry consent', () => {
  beforeEach(() => {
    mockStorageValues.clear();
  });

  it('defaults anonymous diagnostics off', () => {
    expect(isTelemetryEnabled()).toBe(false);
  });

  it('persists the anonymous diagnostics preference locally', () => {
    setTelemetryConsent(true);

    expect(mockStorageValues.get(telemetryConsentStorageKeys.shareAnonymousDiagnostics)).toBe(true);
    expect(isTelemetryEnabled()).toBe(true);
  });
});
