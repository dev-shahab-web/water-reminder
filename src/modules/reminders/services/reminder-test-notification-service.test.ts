import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { HYDRATION_ACTIVE_CHANNEL_ID } from '@platform/notifications/notification-channels';

import type { ReminderPreferences } from '../types';
import {
  TEST_REMINDER_NOTIFICATION_ID,
  scheduleTestReminderNotification,
} from './reminder-test-notification-service';

const mockCancelLocalNotifications = jest.fn(async (_identifiers: readonly string[]) => undefined);
const mockScheduleLocalNotification = jest.fn(async (request: { identifier?: string }) =>
  request.identifier === undefined ? 'test-reminder-id' : request.identifier,
);

jest.mock('@platform/notifications', () => ({
  REMINDER_NOTIFICATION_CATEGORY: 'water_reminder.hydration_reminder.v1',
  buildReminderNotificationData: ({
    occurrenceId,
    source,
  }: {
    occurrenceId?: string;
    source: 'scheduled' | 'snoozed' | 'test';
  }) => ({
    ...(occurrenceId === undefined ? {} : { occurrenceId }),
    schemaVersion: 1,
    source,
    type: 'hydration_reminder',
  }),
  cancelLocalNotifications: (identifiers: readonly string[]) =>
    mockCancelLocalNotifications(identifiers),
  scheduleLocalNotification: (request: { identifier?: string }) =>
    mockScheduleLocalNotification(request),
}));

const preferences: ReminderPreferences = {
  activationState: 'enabled',
  activeModeDefaultsApplied: true,
  defaultSnoozeMinutes: 10,
  enabled: true,
  intervalMinutes: 60,
  mode: 'active',
  preferenceSchemaVersion: 2,
  scheduledNotificationIds: [],
  sleepTime: '21:00',
  snoozeEnabled: true,
  sound: { type: 'system_default' },
  timezone: 'UTC',
  vibrationEnabled: true,
  wakeTime: '09:00',
};

describe('reminder test notification service', () => {
  beforeEach(() => {
    mockCancelLocalNotifications.mockClear();
    mockScheduleLocalNotification.mockClear();
  });

  it('schedules test reminders with the real reminder notification content pipeline', async () => {
    await expect(
      scheduleTestReminderNotification({
        now: new Date('2026-07-21T10:00:00.000Z'),
        preferences,
      }),
    ).resolves.toBe(true);

    expect(mockScheduleLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
        body: 'Time for a sip.',
        categoryIdentifier: 'water_reminder.hydration_reminder.v1',
        date: new Date('2026-07-21T10:00:02.000Z'),
        identifier: TEST_REMINDER_NOTIFICATION_ID,
        sound: 'default',
        title: 'Water Reminder',
        vibrate: [0, 240, 160, 240],
      }),
    );
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      data: {
        occurrenceId: TEST_REMINDER_NOTIFICATION_ID,
        schemaVersion: 1,
        source: 'test',
        type: 'hydration_reminder',
      },
    });
  });

  it('replaces any previously scheduled test reminder before scheduling another one', async () => {
    await scheduleTestReminderNotification({
      now: new Date('2026-07-21T10:00:00.000Z'),
      preferences,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith([TEST_REMINDER_NOTIFICATION_ID]);
  });
});
