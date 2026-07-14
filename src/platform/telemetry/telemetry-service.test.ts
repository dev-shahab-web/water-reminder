import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/* eslint-disable @typescript-eslint/no-require-imports */

const mockAnalyticsInstance = {
  logEvent: jest.fn<() => Promise<void>>(),
  logScreenView: jest.fn<() => Promise<void>>(),
  setAnalyticsCollectionEnabled: jest.fn<() => Promise<void>>(),
};
const mockCrashlyticsInstance = {
  recordError: jest.fn(),
  setAttribute: jest.fn<() => Promise<void>>(),
  setAttributes: jest.fn<() => Promise<void>>(),
  setCrashlyticsCollectionEnabled: jest.fn<() => Promise<void>>(),
};
let mockTelemetryEnabled = false;

jest.mock('@react-native-firebase/analytics', () => () => mockAnalyticsInstance);
jest.mock('@react-native-firebase/crashlytics', () => () => mockCrashlyticsInstance);
jest.mock('./telemetry-consent', () => ({
  isTelemetryEnabled: () => mockTelemetryEnabled,
  setTelemetryConsent: (enabled: boolean) => {
    mockTelemetryEnabled = enabled;
    return enabled;
  },
}));

const { recordHandledError, setTelemetryEnabled, trackEvent, trackEventSafely, trackScreen } =
  require('./telemetry-service') as typeof import('./telemetry-service');

describe('telemetry service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTelemetryEnabled = false;
    mockAnalyticsInstance.logEvent.mockResolvedValue(undefined);
    mockAnalyticsInstance.logScreenView.mockResolvedValue(undefined);
    mockAnalyticsInstance.setAnalyticsCollectionEnabled.mockResolvedValue(undefined);
    mockCrashlyticsInstance.setAttribute.mockResolvedValue(undefined);
    mockCrashlyticsInstance.setAttributes.mockResolvedValue(undefined);
    mockCrashlyticsInstance.setCrashlyticsCollectionEnabled.mockResolvedValue(undefined);
  });

  it('does not call Firebase when telemetry is disabled', () => {
    trackEvent('app_open');

    expect(mockAnalyticsInstance.logEvent).not.toHaveBeenCalled();
  });

  it('enables and disables Firebase collection from consent changes', async () => {
    await setTelemetryEnabled(true);

    expect(mockAnalyticsInstance.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(true);
    expect(mockCrashlyticsInstance.setCrashlyticsCollectionEnabled).toHaveBeenCalledWith(true);

    await setTelemetryEnabled(false);

    expect(mockAnalyticsInstance.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(false);
    expect(mockCrashlyticsInstance.setCrashlyticsCollectionEnabled).toHaveBeenCalledWith(false);
  });

  it('does not throw when Firebase event logging fails', () => {
    mockTelemetryEnabled = true;
    mockAnalyticsInstance.logEvent.mockRejectedValue(new Error('Firebase unavailable'));

    expect(() => trackEvent('settings_opened', { source: 'app' })).not.toThrow();
  });

  it('tracks notification taps without sensitive parameters', async () => {
    mockTelemetryEnabled = true;

    trackEvent('notification_clicked', { source: 'notification' });

    await Promise.resolve();

    expect(mockAnalyticsInstance.logEvent).toHaveBeenCalledWith('notification_clicked', {
      source: 'notification',
    });
  });

  it('isolates telemetry sanitizer failures from product actions when using the safe wrapper', () => {
    mockTelemetryEnabled = true;

    expect(() =>
      trackEventSafely('hydration_log_action', { amount_ml: 250 } as never),
    ).not.toThrow();

    expect(mockAnalyticsInstance.logEvent).not.toHaveBeenCalled();
  });

  it('prevents duplicate screen tracking during rerenders', async () => {
    mockTelemetryEnabled = true;

    trackScreen('/settings');
    trackScreen('/settings?ignored=value');

    await Promise.resolve();

    expect(mockAnalyticsInstance.logEvent).toHaveBeenCalledTimes(1);
    expect(mockAnalyticsInstance.logScreenView).toHaveBeenCalledTimes(1);
  });

  it('does not emit settings_opened from Settings screen rerenders', async () => {
    mockTelemetryEnabled = true;

    trackScreen('/settings');
    trackScreen('/settings');

    await Promise.resolve();

    expect(mockAnalyticsInstance.logEvent).not.toHaveBeenCalledWith(
      'settings_opened',
      expect.anything(),
    );
  });

  it('records handled errors with safe categories', async () => {
    mockTelemetryEnabled = true;

    recordHandledError('health_connect_sync_failed', new Error('Raw native details'), {
      source: 'app',
    });

    await Promise.resolve();

    expect(mockCrashlyticsInstance.recordError).toHaveBeenCalledWith(
      new Error('Error: health_connect_sync_failed'),
      'health_connect_sync_failed',
    );
  });
});
