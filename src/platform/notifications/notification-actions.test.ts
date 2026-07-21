import { describe, expect, it } from '@jest/globals';

import {
  REMINDER_ACTION_DISMISS,
  REMINDER_ACTION_DRINK,
  REMINDER_ACTION_SNOOZE,
  buildReminderNotificationData,
  isReminderNotificationActionIdentifier,
  isReminderNotificationData,
  reminderActionIdentifiers,
} from './notification-actions';

describe('notification action contracts', () => {
  it('keeps reminder action identifiers stable and distinct', () => {
    expect(REMINDER_ACTION_DRINK).toBe('water_reminder.reminder.drink');
    expect(REMINDER_ACTION_SNOOZE).toBe('water_reminder.reminder.snooze');
    expect(REMINDER_ACTION_DISMISS).toBe('water_reminder.reminder.dismiss');
    expect(new Set(reminderActionIdentifiers).size).toBe(3);
  });

  it('recognizes only supported reminder action identifiers', () => {
    expect(isReminderNotificationActionIdentifier(REMINDER_ACTION_DRINK)).toBe(true);
    expect(isReminderNotificationActionIdentifier(REMINDER_ACTION_SNOOZE)).toBe(true);
    expect(isReminderNotificationActionIdentifier(REMINDER_ACTION_DISMISS)).toBe(true);
    expect(isReminderNotificationActionIdentifier('water_reminder.reminder.unknown')).toBe(false);
    expect(isReminderNotificationActionIdentifier(undefined)).toBe(false);
  });

  it('builds and parses valid reminder metadata', () => {
    const data = buildReminderNotificationData({
      occurrenceId: 'occurrence-1',
      source: 'scheduled',
    });

    expect(isReminderNotificationData(data)).toBe(true);
    expect(data).toEqual({
      occurrenceId: 'occurrence-1',
      schemaVersion: 1,
      source: 'scheduled',
      type: 'hydration_reminder',
    });
  });

  it('handles optional occurrence identifiers', () => {
    expect(
      buildReminderNotificationData({
        source: 'snoozed',
      }),
    ).toEqual({
      schemaVersion: 1,
      source: 'snoozed',
      type: 'hydration_reminder',
    });
  });

  it('rejects malformed and unknown notification payloads safely', () => {
    expect(isReminderNotificationData(undefined)).toBe(false);
    expect(
      isReminderNotificationData({ type: 'other', schemaVersion: 1, source: 'scheduled' }),
    ).toBe(false);
    expect(isReminderNotificationData({ type: 'hydration_reminder', schemaVersion: 2 })).toBe(
      false,
    );
    expect(
      isReminderNotificationData({
        occurrenceId: 123,
        schemaVersion: 1,
        source: 'scheduled',
        type: 'hydration_reminder',
      }),
    ).toBe(false);
  });
});
