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

import type { ReminderMode, ReminderSoundPreference } from '../types';
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
  sound: ReminderSoundPreference;
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
  sound,
  source,
  vibrationEnabled,
}: ReminderNotificationFactoryInput): ReminderNotificationContent => {
  const effectiveSound = getEffectiveSound({ mode, sound, source });
  const isAudibleReminder = effectiveSound.type !== 'silent';
  const shouldVibrate = mode === 'active' && isAudibleReminder && vibrationEnabled;
  const sanitizedOccurrenceId =
    occurrenceId === undefined || occurrenceId.length === 0 ? undefined : occurrenceId;

  return {
    androidChannelId: getReminderChannelId({ mode, sound: effectiveSound, source }),
    body: resolveReminderCopy(copyKey),
    ...(snoozeEnabled ? { categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY } : {}),
    copyKey,
    data: buildReminderNotificationData({
      occurrenceId: sanitizedOccurrenceId,
      source,
    }),
    sound: isAudibleReminder ? 'default' : false,
    title: reminderNotificationTitle,
    ...(shouldVibrate ? { vibrate: [...activeReminderVibrationPattern] } : {}),
  };
};

const getReminderChannelId = ({
  mode,
  sound,
  source,
}: {
  mode: ReminderMode;
  sound: ReminderSoundPreference;
  source: ReminderNotificationSource;
}): HydrationReminderChannelId => {
  if (source === 'snoozed') {
    return HYDRATION_SNOOZE_CHANNEL_ID;
  }

  if (mode === 'active') {
    return HYDRATION_ACTIVE_CHANNEL_ID;
  }

  if (sound.type === 'silent') {
    return HYDRATION_GENTLE_CHANNEL_ID;
  }

  return HYDRATION_ACTIVE_CHANNEL_ID;
};

const getEffectiveSound = ({
  mode,
  sound,
  source,
}: {
  mode: ReminderMode;
  sound: ReminderSoundPreference;
  source: ReminderNotificationSource;
}): ReminderSoundPreference => {
  if (source === 'snoozed' || mode === 'gentle') {
    return { type: 'silent' };
  }

  if (sound.type === 'silent') {
    return { type: 'system_default' };
  }

  return sound;
};
