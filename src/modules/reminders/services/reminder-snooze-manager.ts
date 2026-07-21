import { cancelLocalNotifications, scheduleLocalNotification } from '@platform/notifications';

import type { ReminderPreferences, ReminderSnoozeMinutes } from '../types';
import {
  getReminderPreferences,
  setReminderPreferences,
} from '../repository/reminder-preferences-storage';
import { buildReminderNotificationContent } from './reminder-notification-factory';
import { addMinutes } from '../utils/time';

const snoozeCopyKey = 'time_for_sip';
const snoozeCollisionWindowMs = 10 * 60 * 1000;
const scheduledReminderIdPattern = /^hydration-reminder-(\d+)-\d+$/;
let snoozeOperationQueue: Promise<void> = Promise.resolve();

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
  return runSerializedSnoozeOperation(async () => {
    const latestPreferences = mergeLatestPendingSnoozeState(preferences);

    return snoozeReminderWithoutLock({
      durationMinutes,
      now,
      preferences: latestPreferences,
    });
  });
};

const snoozeReminderWithoutLock = async ({
  durationMinutes,
  now,
  preferences,
}: {
  durationMinutes?: ReminderSnoozeMinutes;
  now: Date;
  preferences: ReminderPreferences;
}): Promise<ReminderPreferences> => {
  if (!preferences.snoozeEnabled) {
    return preferences;
  }

  const snoozeMinutes = durationMinutes ?? preferences.defaultSnoozeMinutes;

  if (!isReminderSnoozeMinutes(snoozeMinutes)) {
    return preferences;
  }

  await cancelPendingSnoozeNotification(preferences);

  const date = addMinutes(now, snoozeMinutes);
  const pendingSnoozeTargetIso = date.toISOString();

  if (isSnoozeWithinNormalReminderMergeWindow({ preferences, targetDate: date })) {
    return setReminderPreferences({
      ...preferences,
      pendingSnoozeNotificationId: undefined,
      pendingSnoozeTargetIso: undefined,
    });
  }

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
    pendingSnoozeTargetIso:
      pendingSnoozeNotificationId === undefined ? undefined : pendingSnoozeTargetIso,
  });
};

export const clearPendingSnooze = async (
  preferences: ReminderPreferences,
): Promise<ReminderPreferences> => {
  return runSerializedSnoozeOperation(async () => {
    await cancelPendingSnoozeNotification(mergeLatestPendingSnoozeState(preferences));

    return setReminderPreferences({
      ...preferences,
      pendingSnoozeNotificationId: undefined,
      pendingSnoozeTargetIso: undefined,
    });
  });
};

export const clearPendingSnoozeAfterHydrationPersistence =
  async (): Promise<ReminderPreferences> => {
    return clearPendingSnooze(getReminderPreferences());
  };

export const buildPreferencesWithoutPendingSnooze = (
  preferences: ReminderPreferences,
): ReminderPreferences => {
  if (preferences.pendingSnoozeNotificationId !== undefined) {
    void cancelLocalNotifications([preferences.pendingSnoozeNotificationId]);
  }

  return {
    ...preferences,
    pendingSnoozeNotificationId: undefined,
    pendingSnoozeTargetIso: undefined,
  };
};

const cancelPendingSnoozeNotification = async (preferences: ReminderPreferences): Promise<void> => {
  if (preferences.pendingSnoozeNotificationId === undefined) {
    return;
  }

  await cancelLocalNotifications([preferences.pendingSnoozeNotificationId]);
};

const isSnoozeWithinNormalReminderMergeWindow = ({
  preferences,
  targetDate,
}: {
  preferences: ReminderPreferences;
  targetDate: Date;
}): boolean => {
  const targetTime = targetDate.getTime();

  return preferences.scheduledNotificationIds.some((identifier) => {
    const match = scheduledReminderIdPattern.exec(identifier);

    if (match?.[1] === undefined) {
      return false;
    }

    const normalReminderTime = Number.parseInt(match[1], 10);

    return Math.abs(normalReminderTime - targetTime) <= snoozeCollisionWindowMs;
  });
};

const mergeLatestPendingSnoozeState = (preferences: ReminderPreferences): ReminderPreferences => {
  const latestPreferences = getReminderPreferences();

  return {
    ...preferences,
    pendingSnoozeNotificationId:
      latestPreferences.pendingSnoozeNotificationId ?? preferences.pendingSnoozeNotificationId,
    pendingSnoozeTargetIso:
      latestPreferences.pendingSnoozeTargetIso ?? preferences.pendingSnoozeTargetIso,
  };
};

const runSerializedSnoozeOperation = async <Result>(
  operation: () => Promise<Result>,
): Promise<Result> => {
  const resultPromise = snoozeOperationQueue.then(operation, operation);
  snoozeOperationQueue = resultPromise.then(
    () => undefined,
    () => undefined,
  );

  return resultPromise;
};
