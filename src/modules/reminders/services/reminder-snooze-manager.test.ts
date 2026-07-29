import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
} from '@platform/notifications/notification-channels';
import { REMINDER_NOTIFICATION_CATEGORY } from '@platform/notifications/notification-actions';

import { defaultReminderPreferences } from '../repository/reminder-preferences-storage';
import type { ReminderPreferences, ReminderSnoozeMinutes } from '../types';
import { clearPendingSnooze, snoozeReminder } from './reminder-snooze-manager';

const mockStorageValues = new Map<string, boolean | number | string>();
const mockCancelLocalNotifications = jest.fn(async (_identifiers: readonly string[]) => undefined);
const mockScheduleLocalNotification = jest.fn(async (request: { identifier?: string }) =>
  request.identifier === undefined ? 'snooze-id' : request.identifier,
);
const mockPresentedNotifications: { data: Record<string, unknown>; identifier: string }[] = [];
const mockGetScheduledLocalNotifications = jest.fn(async () => [
  {
    data: {
      schemaVersion: 1,
      source: 'snoozed',
      type: 'hydration_reminder',
    },
    identifier: 'hydration-reminder-snooze-1784628600000',
  },
]);

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
  getPresentedLocalNotifications: () => Promise.resolve(mockPresentedNotifications),
  getScheduledLocalNotifications: () => mockGetScheduledLocalNotifications(),
  scheduleLocalNotification: (request: { identifier?: string }) =>
    mockScheduleLocalNotification(request),
}));

const preferences: ReminderPreferences = {
  ...defaultReminderPreferences,
  enabled: true,
  scheduledNotificationIds: ['base-1', 'base-2'],
};

const snoozeDurationCases: readonly [ReminderSnoozeMinutes, string][] = [
  [5, '2026-07-21T10:05:00.000Z'],
  [10, '2026-07-21T10:10:00.000Z'],
  [15, '2026-07-21T10:15:00.000Z'],
  [30, '2026-07-21T10:30:00.000Z'],
  [60, '2026-07-21T11:00:00.000Z'],
];

describe('reminder snooze manager', () => {
  beforeEach(() => {
    mockStorageValues.clear();
    mockPresentedNotifications.length = 0;
    mockCancelLocalNotifications.mockClear();
    mockGetScheduledLocalNotifications.mockClear();
    mockScheduleLocalNotification.mockClear();
  });

  it('schedules one one-off snooze without modifying the base schedule', async () => {
    const nextPreferences = await snoozeReminder({
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences,
    });

    expect(mockCancelLocalNotifications).not.toHaveBeenCalled();
    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY,
      date: new Date('2026-07-21T10:10:00.000Z'),
      identifier: 'hydration-reminder-snooze-1784628600000',
      sound: false,
    });
    expect(nextPreferences.scheduledNotificationIds).toEqual(['base-1', 'base-2']);
    expect(nextPreferences.pendingSnoozeNotificationId).toBe(
      'hydration-reminder-snooze-1784628600000',
    );
    expect(nextPreferences.pendingSnoozeTargetIso).toBe('2026-07-21T10:10:00.000Z');
  });

  it('replaces the latest pending snooze instead of creating duplicates', async () => {
    const nextPreferences = await snoozeReminder({
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences: {
        ...preferences,
        pendingSnoozeNotificationId: 'previous-snooze',
        pendingSnoozeTargetIso: '2026-07-21T09:45:00.000Z',
      },
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['previous-snooze']);
    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(nextPreferences.pendingSnoozeNotificationId).toBe(
      'hydration-reminder-snooze-1784628600000',
    );
    expect(nextPreferences.pendingSnoozeTargetIso).toBe('2026-07-21T10:10:00.000Z');
  });

  it('honors the snooze duration even when it lands exactly on the next normal reminder', async () => {
    const nextPreferences = await snoozeReminder({
      durationMinutes: 30,
      now: new Date('2026-07-21T07:30:00.000Z'),
      preferences: {
        ...preferences,
        scheduledNotificationIds: ['hydration-reminder-1784620800000-0'],
      },
    });

    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      date: new Date('2026-07-21T08:00:00.000Z'),
      identifier: 'hydration-reminder-snooze-1784620800000',
    });
    expect(nextPreferences.pendingSnoozeTargetIso).toBe('2026-07-21T08:00:00.000Z');
    expect(nextPreferences.scheduledNotificationIds).toEqual([
      'hydration-reminder-1784620800000-0',
    ]);
  });

  it('skips scheduling when another hydration notification is already visible', async () => {
    mockPresentedNotifications.push({
      data: {
        schemaVersion: 1,
        source: 'scheduled',
        type: 'hydration_reminder',
      },
      identifier: 'visible-reminder',
    });

    const nextPreferences = await snoozeReminder({
      durationMinutes: 15,
      now: new Date('2026-07-21T07:30:00.000Z'),
      preferences,
    });

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(nextPreferences.pendingSnoozeNotificationId).toBeUndefined();
    expect(nextPreferences.pendingSnoozeTargetIso).toBeUndefined();
  });

  it('ignores the handled visible notification when deciding whether to schedule snooze', async () => {
    mockPresentedNotifications.push({
      data: {
        schemaVersion: 1,
        source: 'scheduled',
        type: 'hydration_reminder',
      },
      identifier: 'handled-reminder',
    });

    const nextPreferences = await snoozeReminder({
      handledNotificationIdentifier: 'handled-reminder',
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences,
    });

    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      date: new Date('2026-07-21T10:10:00.000Z'),
      identifier: 'hydration-reminder-snooze-1784628600000',
    });
    expect(nextPreferences.pendingSnoozeTargetIso).toBe('2026-07-21T10:10:00.000Z');
  });

  it('does not schedule snooze when snooze is disabled', async () => {
    const nextPreferences = await snoozeReminder({
      preferences: {
        ...preferences,
        snoozeEnabled: false,
      },
    });

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(nextPreferences).toMatchObject({
      snoozeEnabled: false,
    });
  });

  it('supports explicit snooze durations', async () => {
    await snoozeReminder({
      durationMinutes: 30,
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences,
    });

    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      date: new Date('2026-07-21T10:30:00.000Z'),
      identifier: 'hydration-reminder-snooze-1784629800000',
    });
  });

  it('uses the configured 5 minute default for one-off snoozed reminders', async () => {
    const nextPreferences = await snoozeReminder({
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences: {
        ...preferences,
        defaultSnoozeMinutes: 5,
        scheduledNotificationIds: [],
        snoozeEnabled: true,
      },
    });

    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY,
      data: {
        occurrenceId: 'hydration-reminder-snooze-1784628300000',
        schemaVersion: 1,
        source: 'snoozed',
        type: 'hydration_reminder',
      },
      date: new Date('2026-07-21T10:05:00.000Z'),
      identifier: 'hydration-reminder-snooze-1784628300000',
      sound: false,
    });
    expect(nextPreferences.pendingSnoozeNotificationId).toBe(
      'hydration-reminder-snooze-1784628300000',
    );
    expect(nextPreferences.pendingSnoozeTargetIso).toBe('2026-07-21T10:05:00.000Z');
  });

  it.each(snoozeDurationCases)(
    'follows the selected %i minute snooze duration exactly',
    async (durationMinutes, targetIso) => {
      const nextPreferences = await snoozeReminder({
        durationMinutes,
        now: new Date('2026-07-21T10:00:00.000Z'),
        preferences: {
          ...preferences,
          scheduledNotificationIds: [],
        },
      });

      expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
      expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
        date: new Date(targetIso),
        identifier: `hydration-reminder-snooze-${new Date(targetIso).getTime()}`,
      });
      expect(nextPreferences.pendingSnoozeTargetIso).toBe(targetIso);
    },
  );

  it('uses the Active reminder channel, sound, and vibration for Active snoozed reminders', async () => {
    await snoozeReminder({
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences: {
        ...preferences,
        mode: 'active',
        scheduledNotificationIds: [],
        sound: { type: 'system_default' },
        vibrationEnabled: true,
      },
    });

    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY,
      sound: 'default',
      vibrate: [0, 240, 160, 240],
    });
  });

  it('uses the default tone for Active snoozes even if stored sound is stale silent', async () => {
    await snoozeReminder({
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences: {
        ...preferences,
        mode: 'active',
        scheduledNotificationIds: [],
        sound: { type: 'silent' },
        vibrationEnabled: true,
      },
    });

    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
      sound: 'default',
      vibrate: [0, 240, 160, 240],
    });
  });

  it('keeps Gentle snoozed reminders on the Gentle quiet channel', async () => {
    await snoozeReminder({
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences: {
        ...preferences,
        mode: 'gentle',
        scheduledNotificationIds: [],
        sound: { type: 'system_default' },
        vibrationEnabled: true,
      },
    });

    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      sound: false,
    });
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).not.toHaveProperty('vibrate');
  });

  it('cleans stale pending snooze ids safely', async () => {
    const nextPreferences = await clearPendingSnooze({
      ...preferences,
      pendingSnoozeNotificationId: 'stale-snooze',
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['stale-snooze']);
    expect(nextPreferences.pendingSnoozeNotificationId).toBeUndefined();
    expect(nextPreferences.pendingSnoozeTargetIso).toBeUndefined();
  });

  it('clears stale pending snooze ids idempotently without canceling normal reminders', async () => {
    await clearPendingSnooze({
      ...preferences,
      pendingSnoozeNotificationId: 'stale-snooze',
      pendingSnoozeTargetIso: '2026-07-21T10:10:00.000Z',
      scheduledNotificationIds: ['normal-1'],
    });
    await clearPendingSnooze({
      ...preferences,
      scheduledNotificationIds: ['normal-1'],
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledTimes(1);
    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['stale-snooze']);
  });
});
