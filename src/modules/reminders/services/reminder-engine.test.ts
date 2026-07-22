import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
  HYDRATION_SNOOZE_CHANNEL_ID,
} from '@platform/notifications/notification-channels';

import {
  defaultReminderPreferences,
  getReminderPreferences,
  setReminderPreferences,
} from '../repository/reminder-preferences-storage';
import type { ReminderPreferences } from '../types';
import {
  activateRemindersWithGrantedPermission,
  enableReminders,
  getReminderStatus,
  reconcileReminderSchedule,
  updateDefaultSnoozePreference,
  updateReminderModePreference,
  updateReminderSchedulePreference,
  updateReminderSnoozePreference,
  updateReminderVibrationPreference,
} from './reminder-engine';

const mockStorageValues = new Map<string, boolean | number | string>();
const mockCancelLocalNotifications = jest.fn(async (_identifiers: readonly string[]) => undefined);
const mockScheduledNotifications: {
  androidChannelId?: string;
  data: Record<string, unknown>;
  identifier: string;
}[] = [];
const mockScheduleLocalNotification = jest.fn(async (request: { identifier?: string }) =>
  request.identifier === undefined ? 'scheduled-id' : request.identifier,
);
const mockRefreshHydrationWidgets = jest.fn(async (_reason: string) => undefined);
const mockInitializeNotificationInfrastructure = jest.fn(async () => undefined);
const mockRequestNotificationPermissions = jest.fn(async () => ({
  canAskAgain: true,
  granted: true,
  status: 'granted',
}));

jest.mock('@platform/storage', () => ({
  getStorage: () => ({
    getBoolean: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'number' ? value : undefined;
    },
    getString: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'string' ? value : undefined;
    },
    remove: (key: string) => {
      mockStorageValues.delete(key);
      return true;
    },
    set: (key: string, value: boolean | number | string) => {
      mockStorageValues.set(key, value);
    },
  }),
}));

jest.mock('@platform/notifications', () => ({
  cancelLocalNotifications: (identifiers: readonly string[]) =>
    mockCancelLocalNotifications(identifiers),
  getScheduledLocalNotifications: () => Promise.resolve(mockScheduledNotifications),
  initializeNotificationInfrastructure: () => mockInitializeNotificationInfrastructure(),
  requestNotificationPermissions: () => mockRequestNotificationPermissions(),
  scheduleLocalNotification: (request: { identifier?: string }) =>
    mockScheduleLocalNotification(request),
}));

jest.mock('@modules/widgets', () => ({
  refreshHydrationWidgets: (reason: string) => mockRefreshHydrationWidgets(reason),
}));

const preferences: ReminderPreferences = {
  ...defaultReminderPreferences,
  activeModeDefaultsApplied: false,
  enabled: true,
  intervalMinutes: 60,
  scheduledNotificationIds: ['old-reminder'],
  sleepTime: '17:00',
  timezone: 'UTC',
  wakeTime: '09:00',
};

describe('reminder engine experience preferences', () => {
  beforeEach(() => {
    mockStorageValues.clear();
    mockScheduledNotifications.length = 0;
    mockCancelLocalNotifications.mockClear();
    mockScheduleLocalNotification.mockClear();
    mockRefreshHydrationWidgets.mockClear();
    mockInitializeNotificationInfrastructure.mockClear();
    mockRequestNotificationPermissions.mockClear();
    mockRequestNotificationPermissions.mockResolvedValue({
      canAskAgain: true,
      granted: true,
      status: 'granted',
    });
    setReminderPreferences(preferences);
  });

  it('enables reminders after notification permission is granted', async () => {
    await expect(enableReminders(defaultReminderPreferences)).resolves.toMatchObject({
      granted: true,
      preferences: {
        activationState: 'enabled',
        enabled: true,
      },
    });
    expect(mockInitializeNotificationInfrastructure).toHaveBeenCalledTimes(1);
    expect(mockRequestNotificationPermissions).toHaveBeenCalledTimes(1);
  });

  it('activates existing onboarding reminder intent without requesting permission again', () => {
    expect(activateRemindersWithGrantedPermission(defaultReminderPreferences)).toMatchObject({
      activationState: 'enabled',
      enabled: true,
      pausedUntilIso: undefined,
    });
    expect(mockRequestNotificationPermissions).not.toHaveBeenCalled();
  });

  it('keeps reminders blocked and internally disabled when permission is denied', async () => {
    mockRequestNotificationPermissions.mockResolvedValue({
      canAskAgain: false,
      granted: false,
      status: 'denied',
    });

    await expect(enableReminders(defaultReminderPreferences)).resolves.toMatchObject({
      granted: false,
      preferences: {
        activationState: 'not_configured',
        enabled: false,
      },
    });
    expect(
      getReminderStatus({
        goalAmount: 2000,
        hasPermission: false,
        preferences: defaultReminderPreferences,
        totalAmount: 0,
      }),
    ).toBe('blocked');
  });

  it('enables vibration the first time Active mode is selected', () => {
    expect(
      updateReminderModePreference(
        {
          ...preferences,
          pendingSnoozeNotificationId: 'pending-snooze',
          pendingSnoozeTargetIso: '2026-07-21T10:10:00.000Z',
        },
        'active',
      ),
    ).toMatchObject({
      activeModeDefaultsApplied: true,
      mode: 'active',
      pendingSnoozeNotificationId: undefined,
      pendingSnoozeTargetIso: undefined,
      vibrationEnabled: true,
    });
    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['pending-snooze']);
  });

  it('does not overwrite an existing Active vibration preference when mode remains Active', () => {
    expect(
      updateReminderModePreference(
        {
          ...preferences,
          mode: 'active',
          vibrationEnabled: false,
        },
        'active',
      ),
    ).toMatchObject({
      mode: 'active',
      vibrationEnabled: false,
    });
  });

  it('applies Active vibration defaults only once across mode switches', () => {
    const activePreferences = updateReminderModePreference(preferences, 'active');
    const gentlePreferences = updateReminderModePreference(
      {
        ...activePreferences,
        vibrationEnabled: false,
      },
      'gentle',
    );

    expect(updateReminderModePreference(gentlePreferences, 'active')).toMatchObject({
      activeModeDefaultsApplied: true,
      mode: 'active',
      vibrationEnabled: false,
    });
  });

  it('persists explicit vibration preference changes', () => {
    expect(updateReminderVibrationPreference(preferences, true)).toMatchObject({
      vibrationEnabled: true,
    });
  });

  it('persists snooze experience preference changes', () => {
    expect(
      updateReminderSnoozePreference(
        {
          ...preferences,
          pendingSnoozeNotificationId: 'pending-snooze',
          pendingSnoozeTargetIso: '2026-07-21T10:10:00.000Z',
        },
        false,
      ),
    ).toMatchObject({
      pendingSnoozeNotificationId: undefined,
      pendingSnoozeTargetIso: undefined,
      snoozeEnabled: false,
    });
    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['pending-snooze']);

    expect(updateDefaultSnoozePreference(preferences, 30)).toMatchObject({
      defaultSnoozeMinutes: 30,
    });
  });

  it('clears pending snooze when the base schedule settings change', () => {
    expect(
      updateReminderSchedulePreference(
        {
          ...preferences,
          pendingSnoozeNotificationId: 'pending-snooze',
          pendingSnoozeTargetIso: '2026-07-21T10:10:00.000Z',
        },
        { intervalMinutes: 90 },
      ),
    ).toMatchObject({
      intervalMinutes: 90,
      pendingSnoozeNotificationId: undefined,
      pendingSnoozeTargetIso: undefined,
    });
    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['pending-snooze']);
  });

  it('clears pending snooze when goal completion makes reminders ineligible', async () => {
    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: {
        ...preferences,
        pendingSnoozeNotificationId: 'pending-snooze',
        pendingSnoozeTargetIso: '2026-07-21T10:10:00.000Z',
      },
      totalAmount: 2000,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['pending-snooze']);
  });

  it('rebuilds reminders with the Active channel after mode changes', async () => {
    const activePreferences = updateReminderModePreference(preferences, 'active');

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: activePreferences,
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['old-reminder']);
    expect(mockScheduleLocalNotification).toHaveBeenCalled();
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
      sound: 'default',
      vibrate: [0, 240, 160, 240],
    });
  });

  it('cancels stale Gentle scheduled reminders before rebuilding Active reminders', async () => {
    const activePreferences = updateReminderModePreference(preferences, 'active');
    setReminderPreferences(activePreferences);

    mockScheduledNotifications.push({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      data: {
        occurrenceId: 'old-reminder',
        schemaVersion: 1,
        source: 'scheduled',
        type: 'hydration_reminder',
      },
      identifier: 'old-reminder',
    });

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: activePreferences,
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['old-reminder']);
    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
    });
  });

  it('cancels duplicate base occurrences discovered through Expo scheduled metadata', async () => {
    mockScheduledNotifications.push(
      {
        androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
        data: {
          occurrenceId: 'shared-occurrence',
          schemaVersion: 1,
          source: 'scheduled',
          type: 'hydration_reminder',
        },
        identifier: 'old-reminder',
      },
      {
        androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
        data: {
          occurrenceId: 'shared-occurrence',
          schemaVersion: 1,
          source: 'scheduled',
          type: 'hydration_reminder',
        },
        identifier: 'duplicate-reminder',
      },
    );

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: {
        ...preferences,
        scheduledNotificationIds: ['old-reminder', 'duplicate-reminder'],
      },
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['duplicate-reminder']);
  });

  it('cancels legacy hydration reminder identifiers without structured metadata', async () => {
    mockScheduledNotifications.push({
      androidChannelId: 'default',
      data: {
        source: 'hydration-reminder',
      },
      identifier: 'hydration-reminder-legacy',
    });

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences,
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['hydration-reminder-legacy']);
  });

  it('preserves unrelated scheduled notifications while reconciling hydration reminders', async () => {
    mockScheduledNotifications.push({
      data: {
        source: 'other-feature',
      },
      identifier: 'unrelated-notification',
    });

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences,
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications.mock.calls.flat()).not.toContain('unrelated-notification');
  });

  it('keeps a valid pending snooze on the snooze channel during reconciliation', async () => {
    mockScheduledNotifications.push({
      androidChannelId: HYDRATION_SNOOZE_CHANNEL_ID,
      data: {
        occurrenceId: 'pending-snooze',
        schemaVersion: 1,
        source: 'snoozed',
        type: 'hydration_reminder',
      },
      identifier: 'pending-snooze',
    });

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: {
        ...preferences,
        pendingSnoozeNotificationId: 'pending-snooze',
      },
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications.mock.calls.flat()).not.toContain('pending-snooze');
  });

  it('keeps a valid pending snooze when Expo does not expose the scheduled channel id', async () => {
    mockScheduledNotifications.push({
      data: {
        occurrenceId: 'pending-snooze',
        schemaVersion: 1,
        source: 'snoozed',
        type: 'hydration_reminder',
      },
      identifier: 'pending-snooze',
    });

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: {
        ...preferences,
        pendingSnoozeNotificationId: 'pending-snooze',
      },
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications.mock.calls.flat()).not.toContain('pending-snooze');
  });

  it('cancels a pending snooze when Expo exposes an explicit wrong channel id', async () => {
    mockScheduledNotifications.push({
      androidChannelId: HYDRATION_ACTIVE_CHANNEL_ID,
      data: {
        occurrenceId: 'pending-snooze',
        schemaVersion: 1,
        source: 'snoozed',
        type: 'hydration_reminder',
      },
      identifier: 'pending-snooze',
    });

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: {
        ...preferences,
        pendingSnoozeNotificationId: 'pending-snooze',
      },
      totalAmount: 250,
    });

    expect(mockCancelLocalNotifications).toHaveBeenCalledWith(['pending-snooze']);
  });

  it('keeps Gentle reminders on the Gentle channel', async () => {
    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences,
      totalAmount: 250,
    });

    expect(mockScheduleLocalNotification.mock.calls[0]?.[0]).toMatchObject({
      androidChannelId: HYDRATION_GENTLE_CHANNEL_ID,
      sound: false,
    });
  });

  it('does not let stale reconciliation overwrite newer vibration or snooze preferences', async () => {
    const stalePreferences = {
      ...preferences,
      snoozeEnabled: true,
      vibrationEnabled: false,
    };
    setReminderPreferences({
      ...preferences,
      scheduledNotificationIds: ['current-reminder'],
      snoozeEnabled: false,
      vibrationEnabled: true,
    });

    await reconcileReminderSchedule({
      goalAmount: 2000,
      preferences: stalePreferences,
      totalAmount: 250,
    });

    expect(getReminderPreferences()).toMatchObject({
      scheduledNotificationIds: ['current-reminder'],
      snoozeEnabled: false,
      vibrationEnabled: true,
    });
    expect(mockScheduleLocalNotification).not.toHaveBeenCalled();
  });
});
