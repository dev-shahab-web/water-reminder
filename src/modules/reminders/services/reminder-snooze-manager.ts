import {
  cancelLocalNotifications,
  dismissPresentedNotification,
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
import { getReminderGlass } from './reminder-glass';
import { addMinutes } from '../utils/time';
import { runReminderScheduleOperation } from './reminder-operation-queue';

const snoozeCopyKey = 'time_for_sip';
let snoozeOperationQueue: Promise<void> = Promise.resolve();

export const isReminderSnoozeMinutes = (value: number): value is ReminderSnoozeMinutes => {
  return value === 5 || value === 10 || value === 15 || value === 30 || value === 60;
};

export const snoozeReminder = async ({
  durationMinutes,
  handledNotificationIdentifier,
  now,
  preferences,
}: {
  durationMinutes?: ReminderSnoozeMinutes;
  handledNotificationIdentifier?: string;
  now?: Date;
  preferences?: ReminderPreferences;
}): Promise<ReminderPreferences> => {
  return runReminderScheduleOperation(() =>
    runSerializedSnoozeOperation(async () => {
      const latestPreferences = mergeLatestPendingSnoozeState(
        preferences ?? getReminderPreferences(),
      );

      return snoozeReminderWithoutLock({
        durationMinutes,
        handledNotificationIdentifier,
        now: now ?? new Date(),
        preferences: latestPreferences,
      });
    }),
  );
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
  const storedBeforeScheduling = JSON.stringify(getReminderPreferences());

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

  const date = addMinutes(now, snoozeMinutes);
  const pendingSnoozeTargetIso = date.toISOString();

  logger.info('Reminder snooze target calculated.', {
    durationMinutes: snoozeMinutes,
    targetIso: pendingSnoozeTargetIso,
  });

  const occurrenceId = `hydration-reminder-snooze-${date.getTime()}`;
  const notificationContent = buildReminderNotificationContent({
    glass: getReminderGlass(),
    defaultSnoozeMinutes: preferences.defaultSnoozeMinutes,
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

  if (pendingSnoozeNotificationId === undefined) {
    throw new Error('Snooze could not be scheduled. Please try again.');
  }

  const ensurePreferencesUnchanged = async () => {
    // Settings controls are synchronous and can change while the OS schedules.
    // Never overwrite a newer setting or recreate a snooze the user disabled.
    if (JSON.stringify(getReminderPreferences()) !== storedBeforeScheduling) {
      await cancelLocalNotifications([pendingSnoozeNotificationId]);
      throw new Error('Reminder settings changed. Please try Snooze again.');
    }
  };
  await ensurePreferencesUnchanged();

  // Preserve the previous snooze until its replacement has actually scheduled.
  if (preferences.pendingSnoozeNotificationId !== pendingSnoozeNotificationId) {
    await cancelPendingSnoozeNotification(preferences);
  }

  // Base identifiers encode the delivery timestamp (see scheduler.ts). Remove
  // reminders within the snooze window, including an exact-time collision.
  const interruptedIds = preferences.scheduledNotificationIds.filter((identifier) => {
    const match = /^hydration-reminder-(\d+)-\d+$/.exec(identifier);
    return match === null || Number(match[1]) <= date.getTime();
  });
  if (interruptedIds.length > 0) await cancelLocalNotifications(interruptedIds);

  await ensurePreferencesUnchanged();

  const nextPreferences = setReminderPreferences({
    ...preferences,
    pendingSnoozeNotificationId,
    pendingSnoozeTargetIso,
    scheduledNotificationIds: preferences.scheduledNotificationIds.filter(
      (id) => !interruptedIds.includes(id),
    ),
  });

  const presentedNotifications = await getPresentedLocalNotifications();
  await Promise.all(
    presentedNotifications
      .filter(
        (notification) =>
          notification.identifier !== handledNotificationIdentifier &&
          isReminderNotificationData(notification.data),
      )
      .map((notification) => dismissPresentedNotification(notification.identifier)),
  );

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
