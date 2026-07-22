import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { HYDRATION_SNOOZE_CHANNEL_ID } from '@platform/notifications/notification-channels';

import { defaultReminderPreferences } from '../repository/reminder-preferences-storage';
import type { ReminderPreferences } from '../types';
import { clearPendingSnooze, snoozeReminder } from './reminder-snooze-manager';

const mockStorageValues = new Map<string, boolean | number | string>();
const mockCancelLocalNotifications = jest.fn(async (_identifiers: readonly string[]) => undefined);
const mockScheduleLocalNotification = jest.fn(async (request: { identifier?: string }) =>
  request.identifier === undefined ? 'snooze-id' : request.identifier,
);

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
  scheduleLocalNotification: (request: { identifier?: string }) =>
    mockScheduleLocalNotification(request),
}));

const preferences: ReminderPreferences = {
  ...defaultReminderPreferences,
  enabled: true,
  scheduledNotificationIds: ['base-1', 'base-2'],
};

const scheduledReminderIdAt = (iso: string, index = 0): string => {
  return `hydration-reminder-${new Date(iso).getTime()}-${index}`;
};

describe('reminder snooze manager', () => {
  beforeEach(() => {
    mockStorageValues.clear();
    mockCancelLocalNotifications.mockClear();
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
      androidChannelId: HYDRATION_SNOOZE_CHANNEL_ID,
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

  it('suppresses a snooze that lands exactly on the next normal reminder', async () => {
    const nextPreferences = await snoozeReminder({
      durationMinutes: 30,
      now: new Date('2026-07-21T07:30:00.000Z'),
      preferences: {
        ...preferences,
        scheduledNotificationIds: [scheduledReminderIdAt('2026-07-21T08:00:00.000Z')],
      },
    });

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(nextPreferences.pendingSnoozeNotificationId).toBeUndefined();
    expect(nextPreferences.pendingSnoozeTargetIso).toBeUndefined();
    expect(nextPreferences.scheduledNotificationIds).toEqual([
      scheduledReminderIdAt('2026-07-21T08:00:00.000Z'),
    ]);
  });

  it('suppresses a snooze within ten minutes of the next normal reminder', async () => {
    const nextPreferences = await snoozeReminder({
      durationMinutes: 15,
      now: new Date('2026-07-21T07:30:00.000Z'),
      preferences: {
        ...preferences,
        scheduledNotificationIds: [scheduledReminderIdAt('2026-07-21T07:54:00.000Z')],
      },
    });

    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
    expect(nextPreferences.pendingSnoozeNotificationId).toBeUndefined();
  });

  it('schedules outside the ten-minute merge window without changing the base schedule', async () => {
    const nextPreferences = await snoozeReminder({
      durationMinutes: 15,
      now: new Date('2026-07-21T07:30:00.000Z'),
      preferences: {
        ...preferences,
        scheduledNotificationIds: [scheduledReminderIdAt('2026-07-21T08:00:00.000Z')],
      },
    });

    expect(mockScheduleLocalNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      date: new Date('2026-07-21T07:45:00.000Z'),
      identifier: 'hydration-reminder-snooze-1784619900000',
    });
    expect(nextPreferences.scheduledNotificationIds).toEqual([
      scheduledReminderIdAt('2026-07-21T08:00:00.000Z'),
    ]);
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
      androidChannelId: HYDRATION_SNOOZE_CHANNEL_ID,
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
