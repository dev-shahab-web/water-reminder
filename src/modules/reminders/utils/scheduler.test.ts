import { describe, expect, it } from '@jest/globals';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
} from '@platform/notifications/notification-channels';
import {
  REMINDER_NOTIFICATION_CATEGORY,
  isReminderNotificationData,
} from '@platform/notifications/notification-actions';

import type { ReminderPreferences } from '../types';
import { calculateReminderSchedule, getSmartIntervalMinutes } from './scheduler';

const preferences: ReminderPreferences = {
  activationState: 'enabled',
  activeModeDefaultsApplied: false,
  defaultSnoozeMinutes: 10,
  enabled: true,
  intervalMinutes: 60,
  mode: 'gentle',
  preferenceSchemaVersion: 1,
  scheduledNotificationIds: [],
  sleepTime: '17:00',
  snoozeEnabled: true,
  sound: {
    type: 'silent',
  },
  timezone: 'UTC',
  vibrationEnabled: false,
  wakeTime: '09:00',
};

describe('reminder scheduler', () => {
  it('does not schedule when disabled', () => {
    const now = new Date('2026-07-10T10:00:00.000Z');

    expect(
      calculateReminderSchedule({
        goalAmount: 2000,
        now,
        preferences: { ...preferences, enabled: false },
        totalAmount: 0,
      }),
    ).toEqual([]);
  });

  it('resumes scheduling after a short pause without requiring the app to reopen', () => {
    const reminders = calculateReminderSchedule({
      goalAmount: 2000,
      now: new Date('2026-07-10T10:00:00.000Z'),
      preferences: { ...preferences, pausedUntilIso: '2026-07-10T12:00:00.000Z' },
      totalAmount: 0,
    });

    expect(reminders[0]?.date.toISOString()).toBe('2026-07-10T13:00:00.000Z');
  });

  it('skips today after goal completion but keeps future days scheduled', () => {
    const reminders = calculateReminderSchedule({
      goalAmount: 2000,
      now: new Date('2026-07-10T10:00:00.000Z'),
      preferences,
      totalAmount: 2000,
    });

    expect(reminders[0]?.date.toISOString()).toBe('2026-07-11T09:00:00.000Z');
    expect(reminders.some((reminder) => reminder.date.toISOString().startsWith('2026-07-10'))).toBe(
      false,
    );
  });

  it('keeps tomorrow scheduled when reminders are paused for today', () => {
    const reminders = calculateReminderSchedule({
      goalAmount: 2000,
      now: new Date('2026-07-10T10:00:00.000Z'),
      preferences: { ...preferences, pausedUntilIso: '2026-07-10T23:59:59.999Z' },
      totalAmount: 0,
    });

    expect(reminders[0]?.date.toISOString()).toBe('2026-07-11T09:00:00.000Z');
  });

  it('reduces frequency as progress approaches the goal', () => {
    expect(getSmartIntervalMinutes({ intervalMinutes: 60, progress: 0.2 })).toBe(60);
    expect(getSmartIntervalMinutes({ intervalMinutes: 60, progress: 0.5 })).toBe(90);
    expect(getSmartIntervalMinutes({ intervalMinutes: 60, progress: 0.85 })).toBe(135);
  });

  it('schedules reminders inside active hours only', () => {
    const reminders = calculateReminderSchedule({
      goalAmount: 2000,
      now: new Date('2026-07-10T08:30:00.000Z'),
      preferences,
      totalAmount: 250,
    });

    expect(reminders[0]?.date.toISOString()).toBe('2026-07-10T09:00:00.000Z');
    expect(reminders.every((reminder) => reminder.date.getUTCHours() >= 9)).toBe(true);
    expect(reminders.every((reminder) => reminder.date.getUTCHours() <= 17)).toBe(true);
  });

  it('supports the default 09:00 to midnight active window', () => {
    const reminders = calculateReminderSchedule({
      goalAmount: 2000,
      now: new Date('2026-07-10T08:30:00.000Z'),
      preferences: {
        ...preferences,
        intervalMinutes: 60,
        sleepTime: '00:00',
        wakeTime: '09:00',
      },
      totalAmount: 250,
    });
    const firstDayReminders = reminders.filter((reminder) =>
      reminder.date.toISOString().startsWith('2026-07-10'),
    );

    expect(firstDayReminders[0]?.date.toISOString()).toBe('2026-07-10T09:00:00.000Z');
    expect(firstDayReminders.at(-1)?.date.toISOString()).toBe('2026-07-10T23:00:00.000Z');
    expect(firstDayReminders).toHaveLength(15);
  });

  it('preserves Gentle reminder copy while adding channel, action, and metadata contracts', () => {
    const reminders = calculateReminderSchedule({
      goalAmount: 2000,
      now: new Date('2026-07-10T08:30:00.000Z'),
      preferences,
      totalAmount: 250,
    });

    expect(reminders[0]).toMatchObject({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      body: 'Time for a sip.',
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY,
      identifier: 'hydration-reminder-1783674000000-0',
      sound: false,
      title: 'Water Reminder',
    });
    expect(isReminderNotificationData(reminders[0]?.data)).toBe(true);
  });

  it('uses active notification content when preferences are active', () => {
    const reminders = calculateReminderSchedule({
      goalAmount: 2000,
      now: new Date('2026-07-10T08:30:00.000Z'),
      preferences: {
        ...preferences,
        mode: 'active',
        sound: { type: 'system_default' },
        vibrationEnabled: true,
      },
      totalAmount: 250,
    });

    expect(reminders[0]).toMatchObject({
      androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
      sound: 'default',
      vibrate: [0, 240, 160, 240],
    });
  });
});
