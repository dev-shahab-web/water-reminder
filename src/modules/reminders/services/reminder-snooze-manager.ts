import {
  cancelLocalNotifications,
  getPresentedLocalNotifications,
  getScheduledLocalNotifications,
  scheduleLocalNotification,
} from '@platform/notifications';
import { isReminderNotificationData } from '@platform/notifications/notification-actions';
import { logger } from '@core/logger';

import type { ReminderPreferences, ReminderSnoozeMinutes } from '../types';
import {
  getReminderPreferences,
  setReminderPreferences,
} from '../repository/reminder-preferences-storage';
import { buildReminderNotificationContent } from './reminder-notification-factory';
import { addMinutes } from '../utils/time';

const snoozeCopyKey = 'time_for_sip';
let snoozeOperationQueue: Promise<void> = Promise.resolve();

export const isReminderSnoozeMinutes = (value: number): value is ReminderSnoozeMinutes => {
  return value === 5 || value === 10 || value === 15 || value === 30 || value === 60;
};

export const snoozeReminder = async ({
  durationMinutes,
  handledNotificationIdentifier,
  now = new Date(),
  preferences,
}: {
  durationMinutes?: ReminderSnoozeMinutes;
  handledNotificationIdentifier?: string;
  now?: Date;
  preferences: ReminderPreferences;
}): Promise<ReminderPreferences> => {
  return runSerializedSnoozeOperation(async () => {
    const latestPreferences = mergeLatestPendingSnoozeState(preferences);

    return snoozeReminderWithoutLock({
      durationMinutes,
      handledNotificationIdentifier,
      now,
      preferences: latestPreferences,
    });
  });
};

const snoozeReminderWithoutLock = async ({
  durationMinutes,
  handledNotificationIdentifier,
  now,
  preferences,
}: {
  durationMinutes?: ReminderSnoozeMinutes;
  handledNotificationIdentifier?: string;
  now: Date;
  preferences: ReminderPreferences;
}): Promise<ReminderPreferences> => {
  if (!preferences.snoozeEnabled) {
    logger.info('Reminder snooze skipped.', {
      reason: 'snooze_disabled',
    });
    return preferences;
  }

  const snoozeMinutes = durationMinutes ?? preferences.defaultSnoozeMinutes;

  if (!isReminderSnoozeMinutes(snoozeMinutes)) {
    logger.info('Reminder snooze skipped.', {
      reason: 'invalid_duration',
    });
    return preferences;
  }

  logger.info('Reminder snooze preferences loaded.', {
    defaultSnoozeMinutes: preferences.defaultSnoozeMinutes,
    mode: preferences.mode,
    snoozeEnabled: preferences.snoozeEnabled,
  });

  await cancelPendingSnoozeNotification(preferences);

  const date = addMinutes(now, snoozeMinutes);
  const pendingSnoozeTargetIso = date.toISOString();

  logger.info('Reminder snooze target calculated.', {
    durationMinutes: snoozeMinutes,
    targetIso: pendingSnoozeTargetIso,
  });

  const presentedHydrationNotification = await getVisibleHydrationNotificationToPreserve(
    handledNotificationIdentifier,
  );

  if (presentedHydrationNotification !== undefined) {
    logger.info('Reminder snooze skipped.', {
      presentedNotificationIdentifier: presentedHydrationNotification.identifier,
      reason: 'hydration_notification_already_presented',
      targetIso: pendingSnoozeTargetIso,
    });
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
    snoozeEnabled: preferences.snoozeEnabled,
    sound: preferences.sound,
    source: 'snoozed',
    vibrationEnabled: preferences.vibrationEnabled,
  });
  logger.info('Reminder snooze schedule requested.', {
    channelId: notificationContent.androidChannelId,
    occurrenceId,
    targetIso: pendingSnoozeTargetIso,
  });
  const pendingSnoozeNotificationId = await scheduleLocalNotification({
    ...notificationContent,
    date,
    identifier: occurrenceId,
  });
  logger.info('Reminder snooze schedule completed.', {
    notificationId: pendingSnoozeNotificationId,
    targetIso: pendingSnoozeTargetIso,
  });

  const nextPreferences = setReminderPreferences({
    ...preferences,
    pendingSnoozeNotificationId,
    pendingSnoozeTargetIso:
      pendingSnoozeNotificationId === undefined ? undefined : pendingSnoozeTargetIso,
  });

  logger.info('Reminder snooze persisted.', {
    pendingSnoozeNotificationId: nextPreferences.pendingSnoozeNotificationId,
    pendingSnoozeTargetIso: nextPreferences.pendingSnoozeTargetIso,
  });

  const scheduledNotifications = await getScheduledLocalNotifications();
  logger.info('Reminder snooze scheduled notification audit.', {
    scheduledHydrationNotificationCount: scheduledNotifications.filter((notification) =>
      notification.identifier.startsWith('hydration-reminder'),
    ).length,
    snoozeNotificationPresent:
      pendingSnoozeNotificationId === undefined
        ? false
        : scheduledNotifications.some(
            (notification) => notification.identifier === pendingSnoozeNotificationId,
          ),
  });

  return nextPreferences;
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

const getVisibleHydrationNotificationToPreserve = async (
  handledNotificationIdentifier: string | undefined,
) => {
  const presentedNotifications = await getPresentedLocalNotifications();

  return presentedNotifications.find((notification) => {
    if (notification.identifier === handledNotificationIdentifier) {
      return false;
    }

    return isReminderNotificationData(notification.data);
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
