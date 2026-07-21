import { describe, expect, it } from '@jest/globals';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
  HYDRATION_SNOOZE_CHANNEL_ID,
} from '@platform/notifications/notification-channels';
import {
  REMINDER_NOTIFICATION_CATEGORY,
  isReminderNotificationData,
} from '@platform/notifications/notification-actions';

import { buildReminderNotificationContent } from './reminder-notification-factory';

describe('reminder notification factory', () => {
  it('builds Gentle reminder content for the gentle channel', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'time_for_sip',
      mode: 'gentle',
      occurrenceId: 'occurrence-1',
      snoozeEnabled: true,
      sound: { type: 'silent' },
      source: 'scheduled',
      vibrationEnabled: false,
    });

    expect(content).toMatchObject({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      body: 'Time for a sip.',
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY,
      copyKey: 'time_for_sip',
      sound: false,
      title: 'Water Reminder',
    });
    expect(content.vibrate).toBeUndefined();
    expect(content.data).toEqual({
      occurrenceId: 'occurrence-1',
      schemaVersion: 1,
      source: 'scheduled',
      type: 'hydration_reminder',
    });
    expect(isReminderNotificationData(content.data)).toBe(true);
  });

  it('builds Active reminder content for the active channel', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'small_sip_steady',
      mode: 'active',
      snoozeEnabled: true,
      sound: { type: 'system_default' },
      source: 'scheduled',
      vibrationEnabled: true,
    });

    expect(content.androidChannelId).toBe(HYDRATION_ACTIVE_CHANNEL_ID);
    expect(content.sound).toBe('default');
    expect(content.vibrate).toEqual([0, 240, 160, 240]);
  });

  it('uses the quiet snooze channel for silent snoozed reminders', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'take_moment_hydrate',
      mode: 'active',
      snoozeEnabled: true,
      sound: { type: 'silent' },
      source: 'snoozed',
      vibrationEnabled: true,
    });

    expect(content.androidChannelId).toBe(HYDRATION_SNOOZE_CHANNEL_ID);
    expect(content.sound).toBe(false);
    expect(content.vibrate).toBeUndefined();
    expect(content.data.source).toBe('snoozed');
  });

  it('keeps snoozed audible reminders on the active channel', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'take_moment_hydrate',
      mode: 'active',
      snoozeEnabled: true,
      sound: { type: 'device_picker' },
      source: 'snoozed',
      vibrationEnabled: true,
    });

    expect(content.androidChannelId).toBe(HYDRATION_ACTIVE_CHANNEL_ID);
    expect(content.sound).toBe('default');
    expect(content.vibrate).toEqual([0, 240, 160, 240]);
  });

  it('omits the action category when snooze is disabled', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'little_water_refresh',
      mode: 'gentle',
      snoozeEnabled: false,
      sound: { type: 'silent' },
      source: 'scheduled',
      vibrationEnabled: false,
    });

    expect(content.categoryIdentifier).toBeUndefined();
  });

  it('does not include sensitive hydration or scheduling fields', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'time_for_sip',
      mode: 'active',
      occurrenceId: 'safe-occurrence',
      snoozeEnabled: true,
      sound: { type: 'system_default' },
      source: 'scheduled',
      vibrationEnabled: true,
    });
    const serializedContent = JSON.stringify(content).toLowerCase();

    expect(serializedContent).not.toContain('amount');
    expect(serializedContent).not.toContain('goal');
    expect(serializedContent).not.toContain('reminder_time');
    expect(serializedContent).not.toContain('timestamp');
    expect(serializedContent).not.toContain('record');
  });
});
