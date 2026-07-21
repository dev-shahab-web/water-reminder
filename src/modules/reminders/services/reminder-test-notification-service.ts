import { scheduleLocalNotification } from '@platform/notifications';

import type { ReminderPreferences } from '../types';
import { addMinutes } from '../utils/time';
import { buildReminderNotificationContent } from './reminder-notification-factory';

const testReminderDelayMinutes = 1 / 30;

export const scheduleTestReminderNotification = async ({
  now = new Date(),
  preferences,
}: {
  now?: Date;
  preferences: ReminderPreferences;
}): Promise<boolean> => {
  const date = addMinutes(now, testReminderDelayMinutes);
  const occurrenceId = `hydration-reminder-test-${date.getTime()}`;
  const notificationContent = buildReminderNotificationContent({
    copyKey: 'time_for_sip',
    mode: preferences.mode,
    occurrenceId,
    snoozeEnabled: preferences.snoozeEnabled,
    sound: preferences.sound,
    source: 'scheduled',
    vibrationEnabled: preferences.vibrationEnabled,
  });
  const identifier = await scheduleLocalNotification({
    ...notificationContent,
    date,
    identifier: occurrenceId,
  });

  return identifier !== undefined;
};
