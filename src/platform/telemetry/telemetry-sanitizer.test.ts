import { describe, expect, it } from '@jest/globals';

import {
  sanitizeHandledError,
  sanitizeScreenName,
  sanitizeTelemetryEvent,
} from './telemetry-sanitizer';

describe('telemetry sanitizer', () => {
  it('accepts allowlisted events with non-sensitive parameters', () => {
    expect(
      sanitizeTelemetryEvent('screen_view', {
        screen_name: 'home',
        source: 'app',
      }),
    ).toEqual({
      name: 'screen_view',
      parameters: {
        screen_name: 'home',
        source: 'app',
      },
    });
    expect(sanitizeTelemetryEvent('quick_add_used', { source: 'app' })).toEqual({
      name: 'quick_add_used',
      parameters: { source: 'app' },
    });
    expect(sanitizeTelemetryEvent('custom_amount_logged', { source: 'app' })).toEqual({
      name: 'custom_amount_logged',
      parameters: { source: 'app' },
    });
    expect(sanitizeTelemetryEvent('goal_completed', { source: 'app' })).toEqual({
      name: 'goal_completed',
      parameters: { source: 'app' },
    });
    expect(sanitizeTelemetryEvent('notification_clicked', { source: 'notification' })).toEqual({
      name: 'notification_clicked',
      parameters: { source: 'notification' },
    });
  });

  it('rejects unknown event names in development', () => {
    expect(() => sanitizeTelemetryEvent('water_total_changed')).toThrow('Unknown telemetry event');
  });

  it('rejects hydration amounts and health record identifiers', () => {
    expect(() =>
      sanitizeTelemetryEvent('hydration_log_action', {
        amount_ml: 250,
      }),
    ).toThrow('Unsafe telemetry parameter');

    expect(() =>
      sanitizeTelemetryEvent('health_connect_sync_completed', {
        healthConnectRecordId: 'record-1',
      }),
    ).toThrow('Unsafe telemetry parameter');
  });

  it('sanitizes stable route names and rejects unsafe routes', () => {
    expect(sanitizeScreenName('/settings?entryId=abc')).toBe('settings');
    expect(sanitizeScreenName('/onboarding/goal')).toBe('onboarding');
    expect(sanitizeScreenName('/history/2026-07-14')).toBe('history');
    expect(() => sanitizeScreenName('/entry/abc')).toThrow('Unsafe screen route');
  });

  it('converts handled errors into safe categories without raw native messages', () => {
    const sanitized = sanitizeHandledError(
      'health_connect_sync_failed',
      new Error('NativeDatabase.prepareAsync failed with hydration row data'),
      {
        health_connect_available: true,
        source: 'app',
      },
    );

    expect(sanitized).toEqual({
      attributes: {
        health_connect_available: 'true',
        operation_name: 'health_connect_sync_failed',
        source: 'app',
      },
      category: 'health_connect_sync_failed',
      message: 'Error: health_connect_sync_failed',
    });
  });
});
