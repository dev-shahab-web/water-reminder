import { describe, expect, it } from '@jest/globals';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
} from '@platform/notifications/notification-channels';
import {
  REMINDER_NOTIFICATION_CATEGORY,
  REMINDER_NOTIFICATION_CATEGORY_WITHOUT_SNOOZE,
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
      body: 'Time for a sip. Your 250 mL glass is ready.',
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY,
      copyKey: 'time_for_sip',
      sound: false,
      title: 'Time to hydrate',
    });
    expect(content.vibrate).toBeUndefined();
    expect(content.data).toEqual({
      amountMl: 250,
      amountLabel: '250 mL',
      presentationVersion: 1,
      snoozeEnabled: true,
      snoozeMinutes: 10,
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

  it('keeps Gentle snoozed reminders quiet on the Gentle channel', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'take_moment_hydrate',
      mode: 'gentle',
      snoozeEnabled: true,
      sound: { type: 'system_default' },
      source: 'snoozed',
      vibrationEnabled: true,
    });

    expect(content.androidChannelId).toBe(HYDRATION_GENTLE_CHANNEL_ID);
    expect(content.sound).toBe(false);
    expect(content.vibrate).toBeUndefined();
    expect(content.data.source).toBe('snoozed');
  });

  it('keeps Active snoozed reminders on the Active channel with selected sound and vibration', () => {
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

  it('marks test reminders without changing the effective mode channel', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'time_for_sip',
      mode: 'active',
      occurrenceId: 'hydration-reminder-test',
      snoozeEnabled: true,
      sound: { type: 'system_default' },
      source: 'test',
      vibrationEnabled: true,
    });

    expect(content.androidChannelId).toBe(HYDRATION_ACTIVE_CHANNEL_ID);
    expect(content.data).toEqual({
      amountMl: 250,
      amountLabel: '250 mL',
      presentationVersion: 1,
      snoozeEnabled: true,
      snoozeMinutes: 10,
      occurrenceId: 'hydration-reminder-test',
      schemaVersion: 1,
      source: 'test',
      type: 'hydration_reminder',
    });
    expect(isReminderNotificationData(content.data)).toBe(true);
  });

  it('keeps Log and Dismiss available when snooze is disabled', () => {
    const content = buildReminderNotificationContent({
      copyKey: 'little_water_refresh',
      mode: 'gentle',
      snoozeEnabled: false,
      sound: { type: 'silent' },
      source: 'scheduled',
      vibrationEnabled: false,
    });

    expect(content.categoryIdentifier).toBe(REMINDER_NOTIFICATION_CATEGORY_WITHOUT_SNOOZE);
    expect(content.data.snoozeEnabled).toBe(false);
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

    // The chosen glass capacity is presentation data, not hydration history.
    expect(content.data.amountMl).toBe(250);
    expect(serializedContent).not.toContain('totalamount');
    expect(serializedContent).not.toContain('goal');
    expect(serializedContent).not.toContain('reminder_time');
    expect(serializedContent).not.toContain('timestamp');
    expect(serializedContent).not.toContain('record');
  });

  it('carries the displayed glass and snooze duration for later actions', () => {
    const content = buildReminderNotificationContent({
      glass: { amountMl: 473, amountLabel: '16 oz' },
      defaultSnoozeMinutes: 30,
      copyKey: 'time_for_sip',
      mode: 'gentle',
      snoozeEnabled: true,
      sound: { type: 'silent' },
      source: 'snoozed',
      vibrationEnabled: false,
    });
    expect(content.body).toContain('16 oz');
    expect(content.data).toMatchObject({ amountMl: 473, amountLabel: '16 oz', snoozeMinutes: 30 });
  });
});
