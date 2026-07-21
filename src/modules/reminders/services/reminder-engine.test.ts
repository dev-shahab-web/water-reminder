import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
} from '@platform/notifications/notification-channels';

import { defaultReminderPreferences } from '../repository/reminder-preferences-storage';
import type { ReminderPreferences } from '../types';
import {
  reconcileReminderSchedule,
  updateReminderModePreference,
  updateReminderVibrationPreference,
} from './reminder-engine';

const mockStorageValues = new Map<string, boolean | number | string>();
const mockCancelLocalNotifications = jest.fn(async (_identifiers: readonly string[]) => undefined);
const mockScheduleLocalNotification = jest.fn(async (request: { identifier?: string }) =>
  request.identifier === undefined ? 'scheduled-id' : request.identifier,
);
const mockRefreshHydrationWidgets = jest.fn(async (_reason: string) => undefined);

jest.mock('@platform/storage', () => ({
  getStorage: () => ({
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

jest.mock('@platform/notifications', () => ({
  cancelLocalNotifications: (identifiers: readonly string[]) =>
    mockCancelLocalNotifications(identifiers),
  requestNotificationPermissions: jest.fn(),
  scheduleLocalNotification: (request: { identifier?: string }) =>
    mockScheduleLocalNotification(request),
}));

jest.mock('@modules/widgets', () => ({
  refreshHydrationWidgets: (reason: string) => mockRefreshHydrationWidgets(reason),
}));

const preferences: ReminderPreferences = {
  ...defaultReminderPreferences,
  enabled: true,
  intervalMinutes: 60,
  scheduledNotificationIds: ['old-reminder'],
  sleepTime: '17:00',
  timezone: 'UTC',
  wakeTime: '09:00',
};

describe('reminder engine experience preferences', () => {
  beforeEach(() => {
    mockStorageValues.clear();
    mockCancelLocalNotifications.mockClear();
    mockScheduleLocalNotification.mockClear();
    mockRefreshHydrationWidgets.mockClear();
  });

  it('enables vibration the first time Active mode is selected', () => {
    expect(updateReminderModePreference(preferences, 'active')).toMatchObject({
      mode: 'active',
      vibrationEnabled: true,
    });
  });

  it('does not overwrite an existing Active vibration preference when mode remains Active', () => {
    expect(
      updateReminderModePreference(
        {
          ...preferences,
          mode: 'active',
          vibrationEnabled: false,
        },
        'active',
      ),
    ).toMatchObject({
      mode: 'active',
      vibrationEnabled: false,
    });
  });

  it('persists explicit vibration preference changes', () => {
    expect(updateReminderVibrationPreference(preferences, true)).toMatchObject({
      vibrationEnabled: true,
    });
  });

  it('rebuilds reminders with the Active channel after mode changes', async () => {
    const activePreferences = updateReminderModePreference(preferences, 'active');

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: activePreferences,
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['old-reminder']);
    expect(mockScheduleLocalNotification).toHaveBeenCalled();
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
      sound: 'default',
      vibrate: [0, 240, 160, 240],
    });
  });

  it('keeps Gentle reminders on the Gentle channel', async () => {
    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences,
      totalAmount: 250,
    });

    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      sound: false,
    });
  });
});
