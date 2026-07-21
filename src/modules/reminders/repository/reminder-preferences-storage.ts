import { getStorage } from '@platform/storage';

import type {
  ReminderIntervalMinutes,
  ReminderMode,
  ReminderPreferences,
  ReminderSnoozeMinutes,
  ReminderSoundPreference,
  ReminderSoundType,
} from '../types';
import { getCurrentTimezone } from '../utils/time';

export const reminderPreferenceSchemaVersion = 1;

export const reminderStorageKeys = {
  defaultSnoozeMinutes: 'reminderDefaultSnoozeMinutes',
  enabled: 'reminderEnabled',
  intervalMinutes: 'reminderIntervalMinutes',
  lastScheduleSignature: 'reminderLastScheduleSignature',
  mode: 'reminderMode',
  pausedUntilIso: 'reminderPausedUntil',
  pendingSnoozeNotificationId: 'reminderPendingSnoozeNotificationId',
  preferenceSchemaVersion: 'reminderPreferenceSchemaVersion',
  scheduledNotificationIds: 'reminderScheduledNotificationIds',
  sleepTime: 'reminderSleepTime',
  snoozeEnabled: 'reminderSnoozeEnabled',
  soundCustomName: 'reminderCustomSoundName',
  soundType: 'reminderSoundType',
  timezone: 'reminderTimezone',
  vibrationEnabled: 'reminderVibrationEnabled',
  wakeTime: 'reminderWakeTime',
} as const;

export const defaultReminderPreferences: ReminderPreferences = {
  defaultSnoozeMinutes: 10,
  enabled: false,
  intervalMinutes: 120,
  mode: 'gentle',
  preferenceSchemaVersion: reminderPreferenceSchemaVersion,
  scheduledNotificationIds: [],
  sleepTime: '21:00',
  snoozeEnabled: true,
  sound: {
    type: 'system_default',
  },
  timezone: getCurrentTimezone(),
  vibrationEnabled: false,
  wakeTime: '09:00',
};

const isIntervalOption = (value: number | undefined): value is ReminderIntervalMinutes => {
  return value === 30 || value === 60 || value === 90 || value === 120 || value === 180;
};

const isReminderMode = (value: string | undefined): value is ReminderMode => {
  return value === 'gentle' || value === 'active';
};

const isSnoozeOption = (value: number | undefined): value is ReminderSnoozeMinutes => {
  return value === 5 || value === 10 || value === 15 || value === 30 || value === 60;
};

const isSoundType = (value: string | undefined): value is ReminderSoundType => {
  return value === 'system_default' || value === 'custom';
};

const readSoundPreference = ({
  customSoundName,
  soundType,
}: {
  customSoundName?: string;
  soundType?: string;
}): ReminderSoundPreference => {
  if (!isSoundType(soundType)) {
    return defaultReminderPreferences.sound;
  }

  if (soundType === 'custom' && customSoundName !== undefined && customSoundName.length > 0) {
    return {
      customSoundName,
      type: soundType,
    };
  }

  return {
    type: soundType,
  };
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
  const defaultSnoozeMinutes = storage.getNumber(reminderStorageKeys.defaultSnoozeMinutes);
  const intervalMinutes = storage.getNumber(reminderStorageKeys.intervalMinutes);
  const mode = storage.getString(reminderStorageKeys.mode);
  const pausedUntilIso = storage.getString(reminderStorageKeys.pausedUntilIso);
  const pendingSnoozeNotificationId = storage.getString(
    reminderStorageKeys.pendingSnoozeNotificationId,
  );
  const preferenceSchemaVersion = storage.getNumber(reminderStorageKeys.preferenceSchemaVersion);
  const soundType = storage.getString(reminderStorageKeys.soundType);
  const soundCustomName = storage.getString(reminderStorageKeys.soundCustomName);

  const preferences: ReminderPreferences = {
    defaultSnoozeMinutes: isSnoozeOption(defaultSnoozeMinutes)
      ? defaultSnoozeMinutes
      : defaultReminderPreferences.defaultSnoozeMinutes,
    enabled: storage.getBoolean(reminderStorageKeys.enabled) ?? defaultReminderPreferences.enabled,
    intervalMinutes: isIntervalOption(intervalMinutes)
      ? intervalMinutes
      : defaultReminderPreferences.intervalMinutes,
    mode: isReminderMode(mode) ? mode : defaultReminderPreferences.mode,
    pausedUntilIso,
    pendingSnoozeNotificationId,
    preferenceSchemaVersion: reminderPreferenceSchemaVersion,
    scheduledNotificationIds: parseScheduledIds(
      storage.getString(reminderStorageKeys.scheduledNotificationIds),
    ),
    sleepTime:
      storage.getString(reminderStorageKeys.sleepTime) ?? defaultReminderPreferences.sleepTime,
    snoozeEnabled:
      storage.getBoolean(reminderStorageKeys.snoozeEnabled) ??
      defaultReminderPreferences.snoozeEnabled,
    sound: readSoundPreference({
      customSoundName: soundCustomName,
      soundType,
    }),
    timezone:
      storage.getString(reminderStorageKeys.timezone) ?? defaultReminderPreferences.timezone,
    vibrationEnabled:
      storage.getBoolean(reminderStorageKeys.vibrationEnabled) ??
      defaultReminderPreferences.vibrationEnabled,
    wakeTime:
      storage.getString(reminderStorageKeys.wakeTime) ?? defaultReminderPreferences.wakeTime,
  };

  if (preferenceSchemaVersion !== reminderPreferenceSchemaVersion) {
    return setReminderPreferences(preferences);
  }

  return preferences;
};

export const setReminderPreferences = (preferences: ReminderPreferences): ReminderPreferences => {
  const storage = getStorage();

  storage.set(reminderStorageKeys.defaultSnoozeMinutes, preferences.defaultSnoozeMinutes);
  storage.set(reminderStorageKeys.enabled, preferences.enabled);
  storage.set(reminderStorageKeys.intervalMinutes, preferences.intervalMinutes);
  storage.set(reminderStorageKeys.mode, preferences.mode);
  storage.set(reminderStorageKeys.preferenceSchemaVersion, reminderPreferenceSchemaVersion);
  storage.set(reminderStorageKeys.wakeTime, preferences.wakeTime);
  storage.set(reminderStorageKeys.sleepTime, preferences.sleepTime);
  storage.set(reminderStorageKeys.snoozeEnabled, preferences.snoozeEnabled);
  storage.set(reminderStorageKeys.soundType, preferences.sound.type);
  storage.set(reminderStorageKeys.timezone, preferences.timezone);
  storage.set(reminderStorageKeys.vibrationEnabled, preferences.vibrationEnabled);
  storage.set(
    reminderStorageKeys.scheduledNotificationIds,
    JSON.stringify(preferences.scheduledNotificationIds),
  );

  if (preferences.pausedUntilIso === undefined) {
    storage.remove(reminderStorageKeys.pausedUntilIso);
  } else {
    storage.set(reminderStorageKeys.pausedUntilIso, preferences.pausedUntilIso);
  }

  if (preferences.pendingSnoozeNotificationId === undefined) {
    storage.remove(reminderStorageKeys.pendingSnoozeNotificationId);
  } else {
    storage.set(
      reminderStorageKeys.pendingSnoozeNotificationId,
      preferences.pendingSnoozeNotificationId,
    );
  }

  if (preferences.sound.customSoundName === undefined) {
    storage.remove(reminderStorageKeys.soundCustomName);
  } else {
    storage.set(reminderStorageKeys.soundCustomName, preferences.sound.customSoundName);
  }

  return preferences;
};

export const getLastReminderScheduleSignature = (): string | undefined => {
  return getStorage().getString(reminderStorageKeys.lastScheduleSignature);
};

export const setLastReminderScheduleSignature = (signature: string): void => {
  getStorage().set(reminderStorageKeys.lastScheduleSignature, signature);
};
