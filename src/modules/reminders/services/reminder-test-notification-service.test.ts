import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { HYDRATION_ACTIVE_CHANNEL_ID } from '@platform/notifications/notification-channels';

import type { ReminderPreferences } from '../types';
import { scheduleTestReminderNotification } from './reminder-test-notification-service';

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
    source: 'scheduled' | 'snoozed';
  }) => ({
    ...(occurrenceId === undefined ? {} : { occurrenceId }),
    schemaVersion: 1,
    source,
    type: 'hydration_reminder',
  }),
  scheduleLocalNotification: (request: { identifier?: string }) =>
    mockScheduleLocalNotification(request),
}));

const preferences: ReminderPreferences = {
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
        identifier: 'hydration-reminder-test-1784628002000',
        sound: 'default',
        title: 'Water Reminder',
        vibrate: [0, 240, 160, 240],
      }),
    );
  });
});
