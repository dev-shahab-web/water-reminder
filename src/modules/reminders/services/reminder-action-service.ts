import {
  REMINDER_ACTION_DISMISS,
  REMINDER_ACTION_SNOOZE,
  dismissPresentedNotification,
  isDefaultNotificationAction,
  isReminderNotificationActionIdentifier,
  isReminderNotificationData,
  type NotificationResponsePayload,
} from '@platform/notifications';
import { logger } from '@core/logger';
import { defaultQuickAddAmountMl, loadTodayHydration, logHydration } from '@modules/hydration';
import { getOnboardingState } from '@modules/onboarding/repository/onboarding-storage';
import { isValidQuickAddAmount } from '@modules/hydration/utils/quick-add-presets';
import type { AppDispatch } from '@state/store';

import {
  hasHandledReminderOccurrence,
  markReminderOccurrenceHandled,
} from '../repository/reminder-action-storage';
import { loadReminderPreferences, reconcileReminderSchedule } from './reminder-engine';
import { isReminderSnoozeMinutes, snoozeReminder } from './reminder-snooze-manager';

const snoozeActionsInFlight = new Map<string, Promise<void>>();

export type ReminderActionResult =
  'dismissed' | 'drink_logged' | 'duplicate' | 'ignored' | 'open_home' | 'snoozed';

export const handleReminderNotificationResponse = async ({
  dispatch,
  response,
}: {
  dispatch: AppDispatch;
  response: NotificationResponsePayload;
}): Promise<ReminderActionResult> => {
  if (!isReminderNotificationData(response.data)) {
    return 'ignored';
  }

  if (isDefaultNotificationAction(response.actionIdentifier)) {
    return 'open_home';
  }

  if (!isReminderNotificationActionIdentifier(response.actionIdentifier)) {
    return 'ignored';
  }

  if (response.actionIdentifier === REMINDER_ACTION_DISMISS) {
    await dismissPresentedNotification(response.notificationIdentifier);
    return 'dismissed';
  }

  if (response.actionIdentifier === REMINDER_ACTION_SNOOZE) {
    const snoozeActionId = `snooze:${response.data.occurrenceId ?? response.notificationIdentifier}`;
    if (hasHandledReminderOccurrence(snoozeActionId)) return 'duplicate';
    const pendingAction = snoozeActionsInFlight.get(snoozeActionId);
    if (pendingAction) {
      await pendingAction;
      return 'duplicate';
    }
    const preferences = loadReminderPreferences();
    if (!preferences.snoozeEnabled) return 'ignored';
    logger.info('Reminder snooze handler entered.', {
      notificationIdentifier: response.notificationIdentifier,
      source: response.data.source,
    });
    const action = (async () => {
      await snoozeReminder({
        handledNotificationIdentifier: response.notificationIdentifier,
        ...(typeof response.data.snoozeMinutes === 'number' &&
        isReminderSnoozeMinutes(response.data.snoozeMinutes)
          ? { durationMinutes: response.data.snoozeMinutes }
          : {}),
      });
      markReminderOccurrenceHandled(snoozeActionId);
      await dismissPresentedNotification(response.notificationIdentifier);
    })();
    snoozeActionsInFlight.set(snoozeActionId, action);
    try {
      await action;
    } finally {
      snoozeActionsInFlight.delete(snoozeActionId);
    }
    return 'snoozed';
  }

  const occurrenceId = response.data.occurrenceId ?? response.notificationIdentifier;

  if (!markReminderOccurrenceHandled(occurrenceId)) {
    await dismissPresentedNotification(response.notificationIdentifier);
    return 'duplicate';
  }

  await dispatch(
    logHydration({
      // Log the capacity actually shown, even if the default changed afterwards.
      amount:
        typeof response.data.amountMl === 'number' && isValidQuickAddAmount(response.data.amountMl)
          ? response.data.amountMl
          : defaultQuickAddAmountMl,
      source: 'quick_add',
    }),
  ).unwrap();

  const entries = await dispatch(loadTodayHydration()).unwrap();
  const totalAmount = entries.reduce((total, entry) => total + entry.amount, 0);

  await reconcileReminderSchedule({
    goalAmount: getOnboardingState().hydrationGoal,
    preferences: loadReminderPreferences(),
    totalAmount,
  });
  await dismissPresentedNotification(response.notificationIdentifier);

  return 'drink_logged';
};
