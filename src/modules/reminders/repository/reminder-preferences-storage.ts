import { getStorage } from '@platform/storage';

import type { ReminderIntervalMinutes, ReminderPreferences } from '../types';
import { getCurrentTimezone } from '../utils/time';

export const reminderStorageKeys = {
  enabled: 'reminderEnabled',
  intervalMinutes: 'reminderIntervalMinutes',
  lastScheduleSignature: 'reminderLastScheduleSignature',
  pausedUntilIso: 'reminderPausedUntil',
  scheduledNotificationIds: 'reminderScheduledNotificationIds',
  sleepTime: 'reminderSleepTime',
  timezone: 'reminderTimezone',
  wakeTime: 'reminderWakeTime',
} as const;

export const defaultReminderPreferences: ReminderPreferences = {
  enabled: false,
  intervalMinutes: 120,
  scheduledNotificationIds: [],
  sleepTime: '21:00',
  timezone: getCurrentTimezone(),
  wakeTime: '09:00',
};

const isIntervalOption = (value: number | undefined): value is ReminderIntervalMinutes => {
  return value === 30 || value === 60 || value === 90 || value === 120 || value === 180;
};

const parseScheduledIds = (value: string | undefined): string[] => {
  if (value === undefined) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
};

export const getReminderPreferences = (): ReminderPreferences => {
  const storage = getStorage();
  const intervalMinutes = storage.getNumber(reminderStorageKeys.intervalMinutes);
  const pausedUntilIso = storage.getString(reminderStorageKeys.pausedUntilIso);

  return {
    enabled: storage.getBoolean(reminderStorageKeys.enabled) ?? defaultReminderPreferences.enabled,
    intervalMinutes: isIntervalOption(intervalMinutes)
      ? intervalMinutes
      : defaultReminderPreferences.intervalMinutes,
    pausedUntilIso,
    scheduledNotificationIds: parseScheduledIds(
      storage.getString(reminderStorageKeys.scheduledNotificationIds),
    ),
    sleepTime:
      storage.getString(reminderStorageKeys.sleepTime) ?? defaultReminderPreferences.sleepTime,
    timezone:
      storage.getString(reminderStorageKeys.timezone) ?? defaultReminderPreferences.timezone,
    wakeTime:
      storage.getString(reminderStorageKeys.wakeTime) ?? defaultReminderPreferences.wakeTime,
  };
};

export const setReminderPreferences = (preferences: ReminderPreferences): ReminderPreferences => {
  const storage = getStorage();

  storage.set(reminderStorageKeys.enabled, preferences.enabled);
  storage.set(reminderStorageKeys.intervalMinutes, preferences.intervalMinutes);
  storage.set(reminderStorageKeys.wakeTime, preferences.wakeTime);
  storage.set(reminderStorageKeys.sleepTime, preferences.sleepTime);
  storage.set(reminderStorageKeys.timezone, preferences.timezone);
  storage.set(
    reminderStorageKeys.scheduledNotificationIds,
    JSON.stringify(preferences.scheduledNotificationIds),
  );

  if (preferences.pausedUntilIso === undefined) {
    storage.remove(reminderStorageKeys.pausedUntilIso);
  } else {
    storage.set(reminderStorageKeys.pausedUntilIso, preferences.pausedUntilIso);
  }

  return preferences;
};

export const getLastReminderScheduleSignature = (): string | undefined => {
  return getStorage().getString(reminderStorageKeys.lastScheduleSignature);
};

export const setLastReminderScheduleSignature = (signature: string): void => {
  getStorage().set(reminderStorageKeys.lastScheduleSignature, signature);
};
