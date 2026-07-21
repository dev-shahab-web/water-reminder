import {
  cancelLocalNotifications,
  initializeNotificationInfrastructure,
  requestNotificationPermissions,
  scheduleLocalNotification,
} from '@platform/notifications';
import { refreshHydrationWidgets } from '@modules/widgets';

import type {
  ReminderMode,
  ReminderPauseOption,
  ReminderPreferences,
  ReminderScheduleInput,
  ReminderSnoozeMinutes,
  ReminderSoundPreference,
  ReminderStatus,
} from '../types';
import {
  getLastReminderScheduleSignature,
  getReminderPreferences,
  setLastReminderScheduleSignature,
  setReminderPreferences,
} from '../repository/reminder-preferences-storage';
import { buildReminderScheduleSignature, calculateReminderSchedule } from '../utils/scheduler';
import { addMinutes, getCurrentTimezone, getEndOfLocalDay } from '../utils/time';
import {
  buildPreferencesWithoutPendingSnooze,
  clearPendingSnooze,
} from './reminder-snooze-manager';

export const loadReminderPreferences = (): ReminderPreferences => {
  const preferences = getReminderPreferences();
  const timezone = getCurrentTimezone();

  if (preferences.timezone === timezone) {
    return preferences;
  }

  return setReminderPreferences({ ...preferences, timezone });
};

export const getReminderStatus = ({
  goalAmount,
  hasPermission,
  preferences,
  totalAmount,
}: {
  goalAmount: number;
  hasPermission: boolean;
  preferences: ReminderPreferences;
  totalAmount: number;
}): ReminderStatus => {
  const now = new Date();

  if (totalAmount >= goalAmount) {
    return 'complete';
  }

  if (!hasPermission && (preferences.enabled || preferences.activationState === 'not_configured')) {
    return 'blocked';
  }

  if (!preferences.enabled) {
    return 'disabled';
  }

  if (
    preferences.pausedUntilIso !== undefined &&
    new Date(preferences.pausedUntilIso).getTime() > now.getTime()
  ) {
    return 'paused';
  }

  return 'active';
};

export const reconcileReminderSchedule = async (
  input: Omit<ReminderScheduleInput, 'now'>,
): Promise<ReminderPreferences> => {
  const preferences = {
    ...input.preferences,
    timezone: getCurrentTimezone(),
  };

  if (input.totalAmount >= input.goalAmount) {
    await clearPendingSnooze(preferences);
  }

  const signature = buildReminderScheduleSignature({
    goalAmount: input.goalAmount,
    preferences,
    totalAmount: input.totalAmount,
  });

  if (getLastReminderScheduleSignature() === signature) {
    return preferences;
  }

  await cancelLocalNotifications(preferences.scheduledNotificationIds);

  const schedule = calculateReminderSchedule({
    ...input,
    now: new Date(),
    preferences,
  });
  const scheduledNotificationIds = (
    await Promise.all(schedule.map((item) => scheduleLocalNotification(item)))
  ).filter((identifier): identifier is string => identifier !== undefined);
  const nextPreferences = setReminderPreferences({
    ...preferences,
    scheduledNotificationIds,
  });

  setLastReminderScheduleSignature(signature);
  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const enableReminders = async (
  preferences: ReminderPreferences,
): Promise<{ granted: boolean; preferences: ReminderPreferences }> => {
  await initializeNotificationInfrastructure();
  const permission = await requestNotificationPermissions();

  if (!permission.granted) {
    await cancelLocalNotifications(preferences.scheduledNotificationIds);
    await clearPendingSnooze(preferences);
    const nextPreferences = setReminderPreferences({
      ...preferences,
      activationState: 'not_configured',
      enabled: false,
      pendingSnoozeNotificationId: undefined,
      pendingSnoozeTargetIso: undefined,
      scheduledNotificationIds: [],
    });

    void refreshHydrationWidgets('reminder_changed');

    return {
      granted: false,
      preferences: nextPreferences,
    };
  }

  const nextPreferences = setReminderPreferences({
    ...preferences,
    activationState: 'enabled',
    enabled: true,
    pausedUntilIso: undefined,
  });

  void refreshHydrationWidgets('reminder_changed');

  return {
    granted: true,
    preferences: nextPreferences,
  };
};

export const activateRemindersWithGrantedPermission = (
  preferences: ReminderPreferences,
): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...preferences,
    activationState: 'enabled',
    enabled: true,
    pausedUntilIso: undefined,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const disableReminders = async (
  preferences: ReminderPreferences,
): Promise<ReminderPreferences> => {
  await cancelLocalNotifications(preferences.scheduledNotificationIds);
  await clearPendingSnooze(preferences);

  const nextPreferences = setReminderPreferences({
    ...preferences,
    activationState: 'disabled_by_user',
    enabled: false,
    pendingSnoozeNotificationId: undefined,
    pendingSnoozeTargetIso: undefined,
    scheduledNotificationIds: [],
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const updateReminderSchedulePreference = (
  preferences: ReminderPreferences,
  updates: Partial<Pick<ReminderPreferences, 'intervalMinutes' | 'sleepTime' | 'wakeTime'>>,
): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...buildPreferencesWithoutPendingSnooze(preferences),
    ...updates,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const updateReminderModePreference = (
  preferences: ReminderPreferences,
  mode: ReminderMode,
): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...buildPreferencesWithoutPendingSnooze(preferences),
    mode,
    sound:
      mode === 'active' && preferences.sound.type === 'silent'
        ? { type: 'system_default' }
        : preferences.sound,
    vibrationEnabled:
      mode === 'active' && preferences.mode !== 'active' ? true : preferences.vibrationEnabled,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const updateReminderVibrationPreference = (
  preferences: ReminderPreferences,
  vibrationEnabled: boolean,
): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...preferences,
    vibrationEnabled,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const updateReminderSoundPreference = (
  preferences: ReminderPreferences,
  sound: ReminderSoundPreference,
): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...buildPreferencesWithoutPendingSnooze(preferences),
    sound,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const updateReminderSnoozePreference = (
  preferences: ReminderPreferences,
  snoozeEnabled: boolean,
): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...preferences,
    snoozeEnabled,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const updateDefaultSnoozePreference = (
  preferences: ReminderPreferences,
  defaultSnoozeMinutes: ReminderSnoozeMinutes,
): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...preferences,
    defaultSnoozeMinutes,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const pauseReminders = async (
  preferences: ReminderPreferences,
  option: ReminderPauseOption,
): Promise<ReminderPreferences> => {
  const now = new Date();
  const pausedUntil =
    option === '30min'
      ? addMinutes(now, 30)
      : option === '1hour'
        ? addMinutes(now, 60)
        : getEndOfLocalDay(now);

  await cancelLocalNotifications(preferences.scheduledNotificationIds);
  await clearPendingSnooze(preferences);

  const nextPreferences = setReminderPreferences({
    ...preferences,
    pausedUntilIso: pausedUntil.toISOString(),
    pendingSnoozeNotificationId: undefined,
    pendingSnoozeTargetIso: undefined,
    scheduledNotificationIds: [],
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const resumeReminders = (preferences: ReminderPreferences): ReminderPreferences => {
  const nextPreferences = setReminderPreferences({
    ...preferences,
    pausedUntilIso: undefined,
  });

  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};
