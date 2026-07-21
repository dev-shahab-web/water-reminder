import { cancelLocalNotifications, scheduleLocalNotification } from '@platform/notifications';

import type { ReminderPreferences, ReminderSnoozeMinutes } from '../types';
import { setReminderPreferences } from '../repository/reminder-preferences-storage';
import { buildReminderNotificationContent } from './reminder-notification-factory';
import { addMinutes } from '../utils/time';

const snoozeCopyKey = 'time_for_sip';

export const isReminderSnoozeMinutes = (value: number): value is ReminderSnoozeMinutes => {
  return value === 5 || value === 10 || value === 15 || value === 30 || value === 60;
};

export const snoozeReminder = async ({
  durationMinutes,
  now = new Date(),
  preferences,
}: {
  durationMinutes?: ReminderSnoozeMinutes;
  now?: Date;
  preferences: ReminderPreferences;
}): Promise<ReminderPreferences> => {
  if (!preferences.snoozeEnabled) {
    return preferences;
  }

  const snoozeMinutes = durationMinutes ?? preferences.defaultSnoozeMinutes;

  if (!isReminderSnoozeMinutes(snoozeMinutes)) {
    return preferences;
  }

  await cancelPendingSnooze(preferences);

  const date = addMinutes(now, snoozeMinutes);
  const occurrenceId = `hydration-reminder-snooze-${date.getTime()}`;
  const notificationContent = buildReminderNotificationContent({
    copyKey: snoozeCopyKey,
    mode: preferences.mode,
    occurrenceId,
    snoozeEnabled: false,
    sound: preferences.sound,
    source: 'snoozed',
    vibrationEnabled: preferences.vibrationEnabled,
  });
  const pendingSnoozeNotificationId = await scheduleLocalNotification({
    ...notificationContent,
    date,
    identifier: occurrenceId,
  });

  return setReminderPreferences({
    ...preferences,
    pendingSnoozeNotificationId,
  });
};

export const clearPendingSnooze = async (
  preferences: ReminderPreferences,
): Promise<ReminderPreferences> => {
  await cancelPendingSnooze(preferences);

  return setReminderPreferences({
    ...preferences,
    pendingSnoozeNotificationId: undefined,
  });
};

const cancelPendingSnooze = async (preferences: ReminderPreferences): Promise<void> => {
  if (preferences.pendingSnoozeNotificationId === undefined) {
    return;
  }

  await cancelLocalNotifications([preferences.pendingSnoozeNotificationId]);
};
