import {
  cancelLocalNotifications,
  getScheduledLocalNotifications,
  initializeNotificationInfrastructure,
  requestNotificationPermissions,
  scheduleLocalNotification,
  type ScheduledLocalNotification,
} from '@platform/notifications';
import { isReminderNotificationData } from '@platform/notifications/notification-actions';
import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
  HYDRATION_SNOOZE_CHANNEL_ID,
  type HydrationReminderChannelId,
} from '@platform/notifications/notification-channels';
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

const hydrationReminderIdentifierPrefix = 'hydration-reminder-';

type ScheduledHydrationReconciliationSummary = {
  canceledCount: number;
  missingPersistedCount: number;
  preservedCount: number;
  requiresRebuild: boolean;
};

let scheduleOperationQueue: Promise<void> = Promise.resolve();

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
  return runSerializedScheduleOperation(() => reconcileReminderScheduleWithoutLock(input));
};

const reconcileReminderScheduleWithoutLock = async (
  input: Omit<ReminderScheduleInput, 'now'>,
): Promise<ReminderPreferences> => {
  let preferences = {
    ...input.preferences,
    timezone: getCurrentTimezone(),
  };

  if (input.totalAmount >= input.goalAmount) {
    await clearPendingSnooze(preferences);
  }

  const requestedSignature = buildReminderScheduleSignature({
    goalAmount: input.goalAmount,
    preferences,
    totalAmount: input.totalAmount,
  });
  const latestPreferences = {
    ...getReminderPreferences(),
    timezone: preferences.timezone,
  };
  const latestSignature = buildReminderScheduleSignature({
    goalAmount: input.goalAmount,
    preferences: latestPreferences,
    totalAmount: input.totalAmount,
  });

  if (latestSignature !== requestedSignature) {
    return latestPreferences;
  }

  preferences = latestPreferences;

  const signature = buildReminderScheduleSignature({
    goalAmount: input.goalAmount,
    preferences,
    totalAmount: input.totalAmount,
  });
  const scheduledAudit = await reconcileScheduledHydrationNotifications(preferences);

  if (getLastReminderScheduleSignature() === signature && !scheduledAudit.requiresRebuild) {
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
  const latestAfterScheduling = {
    ...getReminderPreferences(),
    timezone: preferences.timezone,
  };
  const latestAfterSchedulingSignature = buildReminderScheduleSignature({
    goalAmount: input.goalAmount,
    preferences: latestAfterScheduling,
    totalAmount: input.totalAmount,
  });

  if (latestAfterSchedulingSignature !== signature) {
    await cancelLocalNotifications(scheduledNotificationIds);
    return latestAfterScheduling;
  }

  const nextPreferences = setReminderPreferences({
    ...latestAfterScheduling,
    scheduledNotificationIds,
  });

  setLastReminderScheduleSignature(signature);
  void refreshHydrationWidgets('reminder_changed');

  return nextPreferences;
};

export const reconcileScheduledHydrationNotifications = async (
  preferences: ReminderPreferences,
): Promise<ScheduledHydrationReconciliationSummary> => {
  const scheduledNotifications = await getScheduledLocalNotifications();
  const expectedBaseChannelId = getExpectedBaseChannelId(preferences);
  const persistedBaseIds = new Set(preferences.scheduledNotificationIds);
  const expectedSnoozeId = preferences.pendingSnoozeNotificationId;
  const seenBaseOccurrenceIds = new Set<string>();
  const seenSnoozeOccurrenceIds = new Set<string>();
  const canceledIdentifiers: string[] = [];
  let preservedCount = 0;

  for (const notification of scheduledNotifications) {
    const action = classifyScheduledHydrationNotification({
      expectedBaseChannelId,
      expectedSnoozeId,
      notification,
      persistedBaseIds,
      seenBaseOccurrenceIds,
      seenSnoozeOccurrenceIds,
    });

    if (action === 'cancel') {
      canceledIdentifiers.push(notification.identifier);
    } else if (action === 'preserve') {
      preservedCount += 1;
    }
  }

  if (canceledIdentifiers.length > 0) {
    await cancelLocalNotifications(canceledIdentifiers);
  }

  const scheduledIdentifierSet = new Set(
    scheduledNotifications.map((notification) => notification.identifier),
  );
  const missingPersistedCount = preferences.scheduledNotificationIds.filter(
    (identifier) => !scheduledIdentifierSet.has(identifier),
  ).length;

  return {
    canceledCount: canceledIdentifiers.length,
    missingPersistedCount,
    preservedCount,
    requiresRebuild: canceledIdentifiers.length > 0 || missingPersistedCount > 0,
  };
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
  const shouldApplyActiveDefaults =
    mode === 'active' && preferences.mode !== 'active' && !preferences.activeModeDefaultsApplied;
  const nextPreferences = setReminderPreferences({
    ...buildPreferencesWithoutPendingSnooze(preferences),
    activeModeDefaultsApplied: shouldApplyActiveDefaults || preferences.activeModeDefaultsApplied,
    mode,
    sound:
      mode === 'active' && preferences.sound.type === 'silent'
        ? { type: 'system_default' }
        : preferences.sound,
    vibrationEnabled: shouldApplyActiveDefaults ? true : preferences.vibrationEnabled,
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
    ...(snoozeEnabled ? preferences : buildPreferencesWithoutPendingSnooze(preferences)),
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

const classifyScheduledHydrationNotification = ({
  expectedBaseChannelId,
  expectedSnoozeId,
  notification,
  persistedBaseIds,
  seenBaseOccurrenceIds,
  seenSnoozeOccurrenceIds,
}: {
  expectedBaseChannelId: HydrationReminderChannelId;
  expectedSnoozeId?: string;
  notification: ScheduledLocalNotification;
  persistedBaseIds: ReadonlySet<string>;
  seenBaseOccurrenceIds: Set<string>;
  seenSnoozeOccurrenceIds: Set<string>;
}): 'cancel' | 'ignore' | 'preserve' => {
  const data = notification.data;
  const hasHydrationIdentifier = notification.identifier.startsWith(
    hydrationReminderIdentifierPrefix,
  );

  if (!isReminderNotificationData(data)) {
    return hasHydrationIdentifier ? 'cancel' : 'ignore';
  }

  if (data.source === 'test') {
    return 'preserve';
  }

  if (data.source === 'snoozed') {
    const occurrenceId = data.occurrenceId ?? notification.identifier;

    if (
      notification.identifier !== expectedSnoozeId ||
      isKnownChannelMismatch(notification.androidChannelId, HYDRATION_SNOOZE_CHANNEL_ID) ||
      seenSnoozeOccurrenceIds.has(occurrenceId)
    ) {
      return 'cancel';
    }

    seenSnoozeOccurrenceIds.add(occurrenceId);
    return 'preserve';
  }

  const occurrenceId = data.occurrenceId ?? notification.identifier;

  if (
    !persistedBaseIds.has(notification.identifier) ||
    isKnownChannelMismatch(notification.androidChannelId, expectedBaseChannelId) ||
    seenBaseOccurrenceIds.has(occurrenceId)
  ) {
    return 'cancel';
  }

  seenBaseOccurrenceIds.add(occurrenceId);
  return 'preserve';
};

const isKnownChannelMismatch = (
  actualChannelId: string | undefined,
  expectedChannelId: HydrationReminderChannelId,
): boolean => {
  return actualChannelId !== undefined && actualChannelId !== expectedChannelId;
};

const getExpectedBaseChannelId = (preferences: ReminderPreferences): HydrationReminderChannelId => {
  if (preferences.mode === 'active') {
    return HYDRATION_ACTIVE_CHANNEL_ID;
  }

  return HYDRATION_GENTLE_CHANNEL_ID;
};

const runSerializedScheduleOperation = async <Result>(
  operation: () => Promise<Result>,
): Promise<Result> => {
  const resultPromise = scheduleOperationQueue.then(operation, operation);
  scheduleOperationQueue = resultPromise.then(
    () => undefined,
    () => undefined,
  );

  return resultPromise;
};
