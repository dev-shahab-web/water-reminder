import {
  REMINDER_ACTION_DISMISS,
  REMINDER_ACTION_SNOOZE,
  dismissPresentedNotification,
  isDefaultNotificationAction,
  isReminderNotificationActionIdentifier,
  isReminderNotificationData,
  type NotificationResponsePayload,
} from '@platform/notifications';
import { defaultQuickAddAmountMl, loadTodayHydration, logHydration } from '@modules/hydration';
import { getOnboardingState } from '@modules/onboarding/repository/onboarding-storage';
import type { AppDispatch } from '@state/store';

import { markReminderOccurrenceHandled } from '../repository/reminder-action-storage';
import { loadReminderPreferences, reconcileReminderSchedule } from './reminder-engine';
import { snoozeReminder } from './reminder-snooze-manager';

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
    await snoozeReminder({
      preferences: loadReminderPreferences(),
    });
    await dismissPresentedNotification(response.notificationIdentifier);
    return 'snoozed';
  }

  const occurrenceId = response.data.occurrenceId ?? response.notificationIdentifier;

  if (!markReminderOccurrenceHandled(occurrenceId)) {
    await dismissPresentedNotification(response.notificationIdentifier);
    return 'duplicate';
  }

  await dispatch(
    logHydration({
      amount: defaultQuickAddAmountMl,
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
