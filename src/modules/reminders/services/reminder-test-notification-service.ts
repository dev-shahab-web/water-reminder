import { cancelLocalNotifications, scheduleLocalNotification } from '@platform/notifications';

import type { ReminderPreferences } from '../types';
import { addMinutes } from '../utils/time';
import { buildReminderNotificationContent } from './reminder-notification-factory';

const testReminderDelayMinutes = 1 / 30;
export const TEST_REMINDER_NOTIFICATION_ID = 'hydration-reminder-test';

export const scheduleTestReminderNotification = async ({
  now = new Date(),
  preferences,
}: {
  now?: Date;
  preferences: ReminderPreferences;
}): Promise<boolean> => {
  const date = addMinutes(now, testReminderDelayMinutes);
  await cancelLocalNotifications([TEST_REMINDER_NOTIFICATION_ID]);

  const notificationContent = buildReminderNotificationContent({
    copyKey: 'time_for_sip',
    mode: preferences.mode,
    occurrenceId: TEST_REMINDER_NOTIFICATION_ID,
    snoozeEnabled: preferences.snoozeEnabled,
    sound: preferences.sound,
    source: 'test',
    vibrationEnabled: preferences.vibrationEnabled,
  });
  const identifier = await scheduleLocalNotification({
    ...notificationContent,
    date,
    identifier: TEST_REMINDER_NOTIFICATION_ID,
  });

  return identifier !== undefined;
};
