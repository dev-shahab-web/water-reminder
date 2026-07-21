import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  defaultReminderPreferences,
  getReminderPreferences,
  reminderPreferenceSchemaVersion,
  reminderStorageKeys,
  setReminderPreferences,
} from './reminder-preferences-storage';

const mockStorageValues = new Map<string, boolean | number | string>();

jest.mock('@platform/storage', () => ({
  getStorage: () => ({
    contains: (key: string) => mockStorageValues.has(key),
    getBoolean: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'number' ? value : undefined;
    },
    getString: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'string' ? value : undefined;
    },
    remove: (key: string) => {
      mockStorageValues.delete(key);
      return true;
    },
    set: (key: string, value: boolean | number | string) => {
      mockStorageValues.set(key, value);
    },
  }),
}));

describe('reminder preferences storage', () => {
  beforeEach(() => {
    mockStorageValues.clear();
  });

  it('returns and persists Gentle reminder experience defaults for new users', () => {
    expect(getReminderPreferences()).toEqual(defaultReminderPreferences);
    expect(mockStorageValues.get(reminderStorageKeys.preferenceSchemaVersion)).toBe(
      reminderPreferenceSchemaVersion,
    );
    expect(mockStorageValues.get(reminderStorageKeys.mode)).toBe('gentle');
    expect(mockStorageValues.get(reminderStorageKeys.vibrationEnabled)).toBe(false);
    expect(mockStorageValues.get(reminderStorageKeys.snoozeEnabled)).toBe(true);
    expect(mockStorageValues.get(reminderStorageKeys.defaultSnoozeMinutes)).toBe(10);
    expect(mockStorageValues.get(reminderStorageKeys.soundType)).toBe('silent');
  });

  it('migrates legacy preferences while preserving schedule, pause, and active-hour choices', () => {
    mockStorageValues.set(reminderStorageKeys.enabled, true);
    mockStorageValues.set(reminderStorageKeys.intervalMinutes, 90);
    mockStorageValues.set(reminderStorageKeys.wakeTime, '08:00');
    mockStorageValues.set(reminderStorageKeys.sleepTime, '22:00');
    mockStorageValues.set(reminderStorageKeys.timezone, 'Asia/Kolkata');
    mockStorageValues.set(reminderStorageKeys.pausedUntilIso, '2026-07-21T18:00:00.000Z');
    mockStorageValues.set(
      reminderStorageKeys.scheduledNotificationIds,
      JSON.stringify(['legacy-1', 'legacy-2']),
    );

    expect(getReminderPreferences()).toEqual({
      defaultSnoozeMinutes: 10,
      enabled: true,
      intervalMinutes: 90,
      mode: 'gentle',
      pausedUntilIso: '2026-07-21T18:00:00.000Z',
      preferenceSchemaVersion: reminderPreferenceSchemaVersion,
      scheduledNotificationIds: ['legacy-1', 'legacy-2'],
      sleepTime: '22:00',
      snoozeEnabled: true,
      sound: {
        type: 'silent',
      },
      timezone: 'Asia/Kolkata',
      vibrationEnabled: false,
      wakeTime: '08:00',
    });
  });

  it('can safely rerun migration without changing already migrated values', () => {
    setReminderPreferences({
      ...defaultReminderPreferences,
      defaultSnoozeMinutes: 30,
      enabled: true,
      intervalMinutes: 30,
      mode: 'active',
      pendingSnoozeNotificationId: 'snooze-1',
      pendingSnoozeTargetIso: '2026-07-21T10:10:00.000Z',
      scheduledNotificationIds: ['active-1'],
      snoozeEnabled: false,
      vibrationEnabled: true,
    });

    const firstRead = getReminderPreferences();
    const secondRead = getReminderPreferences();

    expect(secondRead).toEqual(firstRead);
    expect(secondRead).toMatchObject({
      defaultSnoozeMinutes: 30,
      mode: 'active',
      pendingSnoozeNotificationId: 'snooze-1',
      pendingSnoozeTargetIso: '2026-07-21T10:10:00.000Z',
      scheduledNotificationIds: ['active-1'],
      snoozeEnabled: false,
      vibrationEnabled: true,
    });
  });

  it('recovers invalid reminder experience values to safe defaults', () => {
    mockStorageValues.set(
      reminderStorageKeys.preferenceSchemaVersion,
      reminderPreferenceSchemaVersion,
    );
    mockStorageValues.set(reminderStorageKeys.mode, 'persistent');
    mockStorageValues.set(reminderStorageKeys.defaultSnoozeMinutes, 45);
    mockStorageValues.set(reminderStorageKeys.soundType, 'loud');
    mockStorageValues.set(reminderStorageKeys.intervalMinutes, 12);

    expect(getReminderPreferences()).toEqual(defaultReminderPreferences);
  });

  it('persists the device notification sound preference and clears legacy custom metadata', () => {
    mockStorageValues.set(reminderStorageKeys.soundCustomName, 'soft-drop.wav');

    setReminderPreferences({
      ...defaultReminderPreferences,
      sound: {
        type: 'device_picker',
      },
    });

    expect(mockStorageValues.get(reminderStorageKeys.soundType)).toBe('device_picker');
    expect(mockStorageValues.has(reminderStorageKeys.soundCustomName)).toBe(false);
  });

  it('migrates legacy custom sound metadata to the device notification sound option', () => {
    mockStorageValues.set(reminderStorageKeys.soundType, 'custom');

    expect(getReminderPreferences().sound).toEqual({ type: 'device_picker' });
  });
});
