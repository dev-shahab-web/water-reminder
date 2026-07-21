import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  DEFAULT_NOTIFICATION_ACTION,
  REMINDER_ACTION_DISMISS,
  REMINDER_ACTION_DRINK,
  REMINDER_ACTION_SNOOZE,
  buildReminderNotificationData,
  type NotificationResponsePayload,
} from '@platform/notifications';
import type { AppDispatch } from '@state/store';

import { handleReminderNotificationResponse } from './reminder-action-service';

const mockDismissPresentedNotification = jest.fn(async (_identifier: string) => undefined);
const mockLoadTodayHydration = jest.fn(() => ({
  unwrap: async () => [
    {
      amount: 250,
    },
  ],
}));
const mockLogHydration = jest.fn((_input: { amount: number; source: string }) => ({
  unwrap: async () => ({
    amount: 250,
  }),
}));
const mockReconcileReminderSchedule = jest.fn(async (_input: unknown) => undefined);
const mockSnoozeReminder = jest.fn(async (_input: unknown) => undefined);
const mockGetOnboardingState = jest.fn(() => ({
  hydrationGoal: 2000,
}));
const mockLoadReminderPreferences = jest.fn(() => ({
  defaultSnoozeMinutes: 10,
  enabled: true,
  intervalMinutes: 60,
  mode: 'gentle',
  preferenceSchemaVersion: 1,
  scheduledNotificationIds: [],
  sleepTime: '21:00',
  snoozeEnabled: true,
  sound: {
    type: 'system_default',
  },
  timezone: 'UTC',
  vibrationEnabled: false,
  wakeTime: '09:00',
}));
const mockHandledOccurrences = new Set<string>();

jest.mock('@platform/notifications', () => {
  const defaultAction = 'expo.modules.notifications.actions.DEFAULT';
  const drinkAction = 'water_reminder.reminder.drink';
  const snoozeAction = 'water_reminder.reminder.snooze';
  const dismissAction = 'water_reminder.reminder.dismiss';
  const actionIdentifiers = new Set([drinkAction, snoozeAction, dismissAction]);

  return {
    DEFAULT_NOTIFICATION_ACTION: defaultAction,
    REMINDER_ACTION_DISMISS: dismissAction,
    REMINDER_ACTION_DRINK: drinkAction,
    REMINDER_ACTION_SNOOZE: snoozeAction,
    buildReminderNotificationData: ({
      occurrenceId,
      source,
    }: {
      occurrenceId?: string;
      source: 'scheduled' | 'snoozed';
    }) => ({
      ...(occurrenceId === undefined ? {} : { occurrenceId }),
      schemaVersion: 1,
      source,
      type: 'hydration_reminder',
    }),
    dismissPresentedNotification: (identifier: string) =>
      mockDismissPresentedNotification(identifier),
    isDefaultNotificationAction: (actionIdentifier: string) => actionIdentifier === defaultAction,
    isReminderNotificationActionIdentifier: (actionIdentifier: string) =>
      actionIdentifiers.has(actionIdentifier),
    isReminderNotificationData: (data: unknown) =>
      typeof data === 'object' &&
      data !== null &&
      (data as { schemaVersion?: unknown; source?: unknown; type?: unknown }).type ===
        'hydration_reminder' &&
      (data as { schemaVersion?: unknown; source?: unknown; type?: unknown }).schemaVersion === 1 &&
      ((data as { schemaVersion?: unknown; source?: unknown; type?: unknown }).source ===
        'scheduled' ||
        (data as { schemaVersion?: unknown; source?: unknown; type?: unknown }).source ===
          'snoozed'),
  };
});

jest.mock('@modules/hydration', () => ({
  defaultQuickAddAmountMl: 250,
  loadTodayHydration: () => mockLoadTodayHydration(),
  logHydration: (input: { amount: number; source: string }) => mockLogHydration(input),
}));

jest.mock('@modules/onboarding/repository/onboarding-storage', () => ({
  getOnboardingState: () => mockGetOnboardingState(),
}));

jest.mock('../repository/reminder-action-storage', () => ({
  markReminderOccurrenceHandled: (occurrenceId: string) => {
    if (mockHandledOccurrences.has(occurrenceId)) {
      return false;
    }

    mockHandledOccurrences.add(occurrenceId);
    return true;
  },
}));

jest.mock('./reminder-engine', () => ({
  loadReminderPreferences: () => mockLoadReminderPreferences(),
  reconcileReminderSchedule: (input: unknown) => mockReconcileReminderSchedule(input),
}));

jest.mock('./reminder-snooze-manager', () => ({
  snoozeReminder: (input: unknown) => mockSnoozeReminder(input),
}));

const dispatch = ((action: { unwrap: () => Promise<unknown> }) => action) as AppDispatch;

const createResponse = (
  actionIdentifier: string,
  occurrenceId = 'occurrence-1',
): NotificationResponsePayload => ({
  actionIdentifier,
  data: buildReminderNotificationData({
    occurrenceId,
    source: 'scheduled',
  }),
  notificationIdentifier: 'notification-1',
});

describe('reminder notification action service', () => {
  beforeEach(() => {
    mockHandledOccurrences.clear();
    mockDismissPresentedNotification.mockClear();
    mockLoadTodayHydration.mockClear();
    mockLogHydration.mockClear();
    mockReconcileReminderSchedule.mockClear();
    mockSnoozeReminder.mockClear();
  });

  it('returns open_home for a regular notification tap', async () => {
    await expect(
      handleReminderNotificationResponse({
        dispatch,
        response: createResponse(DEFAULT_NOTIFICATION_ACTION),
      }),
    ).resolves.toBe('open_home');
  });

  it('logs the default quick-add amount exactly once for Drink', async () => {
    await expect(
      handleReminderNotificationResponse({
        dispatch,
        response: createResponse(REMINDER_ACTION_DRINK),
      }),
    ).resolves.toBe('drink_logged');

    await expect(
      handleReminderNotificationResponse({
        dispatch,
        response: createResponse(REMINDER_ACTION_DRINK),
      }),
    ).resolves.toBe('duplicate');

    expect(mockLogHydration).toHaveBeenCalledTimes(1);
    expect(mockLogHydration).toHaveBeenCalledWith({
      amount: 250,
      source: 'quick_add',
    });
    expect(mockLoadTodayHydration).toHaveBeenCalledTimes(1);
    expect(mockReconcileReminderSchedule).toHaveBeenCalledTimes(1);
    expect(mockDismissPresentedNotification).toHaveBeenCalledWith('notification-1');
  });

  it('does not dismiss or mark false success when Drink persistence fails', async () => {
    mockLogHydration.mockReturnValueOnce({
      unwrap: async () => {
        throw new Error('sqlite failed');
      },
    });

    await expect(
      handleReminderNotificationResponse({
        dispatch,
        response: createResponse(REMINDER_ACTION_DRINK, 'failure-occurrence'),
      }),
    ).rejects.toThrow('sqlite failed');

    expect(mockLoadTodayHydration).not.toHaveBeenCalled();
    expect(mockReconcileReminderSchedule).not.toHaveBeenCalled();
    expect(mockDismissPresentedNotification).not.toHaveBeenCalled();
  });

  it('snoozes and dismisses the handled notification', async () => {
    await expect(
      handleReminderNotificationResponse({
        dispatch,
        response: createResponse(REMINDER_ACTION_SNOOZE),
      }),
    ).resolves.toBe('snoozed');

    expect(mockSnoozeReminder).toHaveBeenCalledTimes(1);
    expect(mockDismissPresentedNotification).toHaveBeenCalledWith('notification-1');
  });

  it('dismisses without logging hydration', async () => {
    await expect(
      handleReminderNotificationResponse({
        dispatch,
        response: createResponse(REMINDER_ACTION_DISMISS),
      }),
    ).resolves.toBe('dismissed');

    expect(mockLogHydration).not.toHaveBeenCalled();
    expect(mockDismissPresentedNotification).toHaveBeenCalledWith('notification-1');
  });

  it('ignores malformed reminder action payloads', async () => {
    await expect(
      handleReminderNotificationResponse({
        dispatch,
        response: {
          actionIdentifier: REMINDER_ACTION_DRINK,
          data: { type: 'unknown' },
          notificationIdentifier: 'notification-1',
        },
      }),
    ).resolves.toBe('ignored');
  });
});
