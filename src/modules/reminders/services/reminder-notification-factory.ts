import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
  HYDRATION_SNOOZE_CHANNEL_ID,
  type HydrationReminderChannelId,
} from '@platform/notifications/notification-channels';
import {
  REMINDER_NOTIFICATION_CATEGORY,
  buildReminderNotificationData,
  type ReminderNotificationData,
} from '@platform/notifications/notification-actions';

import type { ReminderMode } from '../types';
import {
  reminderNotificationTitle,
  resolveReminderCopy,
  type ReminderCopyKey,
} from '../utils/reminder-copy';

export type ReminderNotificationSource = ReminderNotificationData['source'];

export type ReminderNotificationFactoryInput = {
  copyKey: ReminderCopyKey;
  mode: ReminderMode;
  occurrenceId?: string;
  snoozeEnabled: boolean;
  source: ReminderNotificationSource;
  vibrationEnabled: boolean;
};

export type ReminderNotificationContent = {
  androidChannelId: HydrationReminderChannelId;
  body: string;
  categoryIdentifier?: string;
  copyKey: ReminderCopyKey;
  data: ReminderNotificationData;
  sound: false | 'default';
  title: string;
  vibrate?: number[];
};

const activeReminderVibrationPattern = [0, 240, 160, 240] as const;

export const buildReminderNotificationContent = ({
  copyKey,
  mode,
  occurrenceId,
  snoozeEnabled,
  source,
  vibrationEnabled,
}: ReminderNotificationFactoryInput): ReminderNotificationContent => {
  const isSnoozedReminder = source === 'snoozed';
  const isActiveReminder = mode === 'active' && !isSnoozedReminder;
  const sanitizedOccurrenceId =
    occurrenceId === undefined || occurrenceId.length === 0 ? undefined : occurrenceId;

  return {
    androidChannelId: getReminderChannelId({ mode, source }),
    body: resolveReminderCopy(copyKey),
    ...(snoozeEnabled ? { categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY } : {}),
    copyKey,
    data: buildReminderNotificationData({
      occurrenceId: sanitizedOccurrenceId,
      source,
    }),
    sound: isActiveReminder ? 'default' : false,
    title: reminderNotificationTitle,
    ...(isActiveReminder && vibrationEnabled
      ? { vibrate: [...activeReminderVibrationPattern] }
      : {}),
  };
};

const getReminderChannelId = ({
  mode,
  source,
}: {
  mode: ReminderMode;
  source: ReminderNotificationSource;
}): HydrationReminderChannelId => {
  if (source === 'snoozed') {
    return HYDRATION_SNOOZE_CHANNEL_ID;
  }

  return mode === 'active' ? HYDRATION_ACTIVE_CHANNEL_ID : HYDRATION_GENTLE_CHANNEL_ID;
};
