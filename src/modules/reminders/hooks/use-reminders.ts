import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { logger } from '@core/logger';
import { playErrorHaptic, playReminderPauseHaptic } from '@platform/haptics';
import {
  getNotificationRegistrationStatus,
  openActiveReminderNotificationSettings,
} from '@platform/notifications';
import { trackEvent } from '@platform/telemetry';
import { getOnboardingState } from '@modules/onboarding/repository/onboarding-storage';

import type {
  ReminderIntervalMinutes,
  ReminderMode,
  ReminderPauseOption,
  ReminderPreferences,
  ReminderSnoozeMinutes,
} from '../types';
import {
  activateRemindersWithGrantedPermission,
  disableReminders,
  enableReminders,
  getReminderStatus,
  loadReminderPreferences,
  pauseReminders,
  reconcileReminderSchedule,
  resumeReminders,
  updateDefaultSnoozePreference,
  updateReminderModePreference,
  updateReminderSchedulePreference,
  updateReminderSnoozePreference,
  updateReminderVibrationPreference,
} from '../services/reminder-engine';
import { subscribeToReminderPreferences } from '../repository/reminder-preferences-storage';
import { calculateReminderSchedule } from '../utils/scheduler';
import { formatReminderTime } from '../utils/time';

type UseRemindersInput = {
  goalAmount: number;
  totalAmount: number;
};

type BooleanReminderPreferenceName = 'snoozeEnabled' | 'vibrationEnabled';

export const useReminders = ({ goalAmount, totalAmount }: UseRemindersInput) => {
  const [preferences, setPreferences] = useState<ReminderPreferences>(() =>
    loadReminderPreferences(),
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | undefined>();
  const operationIdRef = useRef(0);
  const preferenceVersionRef = useRef(0);

  const tracePreferenceUpdate = useCallback((event: string, context: Record<string, unknown>) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.debug('Reminder preference update trace.', {
        event,
        ...context,
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPermission = async () => {
      const status = await getNotificationRegistrationStatus();

      if (isMounted) {
        setHasPermission(status.granted);
      }
    };

    void loadPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToReminderPreferences(() => {
      const nextPreferences = loadReminderPreferences();
      preferenceVersionRef.current += 1;
      setPreferences(nextPreferences);
    });
  }, []);

  useEffect(() => {
    if (!hasPermission || preferences.activationState !== 'not_configured') {
      return;
    }

    if (getOnboardingState().reminderPreference !== 'enabled') {
      return;
    }

    let isMounted = true;

    const activateFromOnboardingIntent = async () => {
      const activatedPreferences = activateRemindersWithGrantedPermission(preferences);
      const scheduledPreferences = await reconcileReminderSchedule({
        goalAmount,
        preferences: activatedPreferences,
        totalAmount,
      });

      if (isMounted) {
        setPreferences(scheduledPreferences);
      }
    };

    void activateFromOnboardingIntent();

    return () => {
      isMounted = false;
    };
  }, [goalAmount, hasPermission, preferences, totalAmount]);

  useEffect(() => {
    if (!preferences.enabled || !hasPermission) {
      return;
    }

    let isMounted = true;
    const startedPreferenceVersion = preferenceVersionRef.current;
    const operationId = ++operationIdRef.current;

    const reconcile = async () => {
      const currentPreferences = loadReminderPreferences();

      tracePreferenceUpdate('schedule_reconciliation_start', {
        operationId,
        preferenceVersion: startedPreferenceVersion,
        snoozeEnabled: currentPreferences.snoozeEnabled,
        vibrationEnabled: currentPreferences.vibrationEnabled,
      });

      const nextPreferences = await reconcileReminderSchedule({
        goalAmount,
        preferences: currentPreferences,
        totalAmount,
      });

      if (isMounted) {
        setPreferences((currentPreferences) => {
          if (startedPreferenceVersion !== preferenceVersionRef.current) {
            tracePreferenceUpdate('stale_schedule_reconciliation_ignored', {
              currentPreferenceVersion: preferenceVersionRef.current,
              operationId,
              startedPreferenceVersion,
            });

            return currentPreferences;
          }

          const mergedPreferences = mergeScheduleOwnedPreferenceFields(
            currentPreferences,
            nextPreferences,
          );

          tracePreferenceUpdate('schedule_reconciliation_finish', {
            operationId,
            scheduledNotificationCount: mergedPreferences.scheduledNotificationIds.length,
            snoozeEnabled: mergedPreferences.snoozeEnabled,
            vibrationEnabled: mergedPreferences.vibrationEnabled,
          });

          return mergedPreferences;
        });
      }
    };

    void reconcile();

    return () => {
      isMounted = false;
    };
  }, [
    goalAmount,
    hasPermission,
    preferences.activationState,
    preferences.defaultSnoozeMinutes,
    preferences.enabled,
    preferences.intervalMinutes,
    preferences.mode,
    preferences.pausedUntilIso,
    preferences.sleepTime,
    preferences.snoozeEnabled,
    preferences.sound.type,
    preferences.timezone,
    preferences.vibrationEnabled,
    preferences.wakeTime,
    totalAmount,
    tracePreferenceUpdate,
  ]);

  useEffect(() => {
    tracePreferenceUpdate('component_rerender_value', {
      preference: 'vibrationEnabled',
      value: preferences.vibrationEnabled,
    });
  }, [preferences.vibrationEnabled, tracePreferenceUpdate]);

  useEffect(() => {
    tracePreferenceUpdate('component_rerender_value', {
      preference: 'snoozeEnabled',
      value: preferences.snoozeEnabled,
    });
  }, [preferences.snoozeEnabled, tracePreferenceUpdate]);

  const status = useMemo(
    () =>
      getReminderStatus({
        goalAmount,
        hasPermission,
        preferences,
        totalAmount,
      }),
    [goalAmount, hasPermission, preferences, totalAmount],
  );

  const preview = useMemo(() => {
    const schedule = calculateReminderSchedule({
      goalAmount,
      now: new Date(),
      preferences,
      totalAmount,
    });

    if (status === 'paused') {
      return 'Paused for now.';
    }

    if (status === 'blocked') {
      return 'Notifications need permission before reminders can run.';
    }

    if (status === 'complete') {
      return 'Done for today. Reminders are quiet.';
    }

    if (!preferences.enabled) {
      return 'Reminders are off.';
    }

    return schedule[0] === undefined
      ? 'No more reminders in this active window.'
      : `Next reminder around ${new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(schedule[0].date)}.`;
  }, [goalAmount, preferences, status, totalAmount]);

  const summary = `${formatReminderTime(preferences.wakeTime)} to ${formatReminderTime(
    preferences.sleepTime,
  )}, every ${preferences.intervalMinutes} min`;

  const toggleEnabled = useCallback(async () => {
    setPermissionMessage(undefined);

    if (preferences.enabled) {
      trackEvent('reminder_disabled', { source: 'app' });
      setPreferences(await disableReminders(preferences));
      return;
    }

    const result = await enableReminders(preferences);
    trackEvent(result.granted ? 'reminder_enabled' : 'reminder_disabled', { source: 'app' });
    setHasPermission(result.granted);

    if (!result.granted) {
      setPreferences(result.preferences);
      setPermissionMessage('Notifications are blocked. Manual tracking still works.');
      await playErrorHaptic();
      return;
    }

    const scheduledPreferences = await reconcileReminderSchedule({
      goalAmount,
      preferences: result.preferences,
      totalAmount,
    });
    setPreferences(scheduledPreferences);
  }, [goalAmount, preferences, totalAmount]);

  const updateInterval = useCallback((intervalMinutes: ReminderIntervalMinutes) => {
    setPreferences((currentPreferences) =>
      updateReminderSchedulePreference(currentPreferences, { intervalMinutes }),
    );
  }, []);

  const updateWakeTime = useCallback((wakeTime: string) => {
    setPreferences((currentPreferences) =>
      updateReminderSchedulePreference(currentPreferences, { wakeTime }),
    );
  }, []);

  const updateSleepTime = useCallback((sleepTime: string) => {
    setPreferences((currentPreferences) =>
      updateReminderSchedulePreference(currentPreferences, { sleepTime }),
    );
  }, []);

  const updateMode = useCallback((mode: ReminderMode) => {
    setPreferences((currentPreferences) => updateReminderModePreference(currentPreferences, mode));
  }, []);

  const commitBooleanPreferenceUpdate = useCallback(
    ({
      name,
      requestedValue,
      updater,
    }: {
      name: BooleanReminderPreferenceName;
      requestedValue: boolean;
      updater: (preferences: ReminderPreferences, value: boolean) => ReminderPreferences;
    }) => {
      const operationId = ++operationIdRef.current;

      tracePreferenceUpdate('handler_entry', {
        operationId,
        preference: name,
        requestedValue,
      });

      setPreferences((currentPreferences) => {
        const previousValue = currentPreferences[name];

        tracePreferenceUpdate('repository_read', {
          operationId,
          preference: name,
          previousValue,
          requestedValue,
        });

        if (previousValue === requestedValue) {
          tracePreferenceUpdate('operation_noop', {
            operationId,
            preference: name,
            value: requestedValue,
          });

          return currentPreferences;
        }

        const nextPreferences = updater(currentPreferences, requestedValue);
        preferenceVersionRef.current += 1;

        tracePreferenceUpdate('repository_write', {
          committedValue: nextPreferences[name],
          operationId,
          preference: name,
          previousValue,
          requestedValue,
        });
        tracePreferenceUpdate('hook_state_update', {
          operationId,
          preference: name,
          value: nextPreferences[name],
        });

        return nextPreferences;
      });
    },
    [tracePreferenceUpdate],
  );

  const updateVibration = useCallback(
    (vibrationEnabled: boolean) => {
      commitBooleanPreferenceUpdate({
        name: 'vibrationEnabled',
        requestedValue: vibrationEnabled,
        updater: updateReminderVibrationPreference,
      });
    },
    [commitBooleanPreferenceUpdate],
  );

  const updateSnoozeEnabled = useCallback(
    (snoozeEnabled: boolean) => {
      commitBooleanPreferenceUpdate({
        name: 'snoozeEnabled',
        requestedValue: snoozeEnabled,
        updater: updateReminderSnoozePreference,
      });
    },
    [commitBooleanPreferenceUpdate],
  );

  const openNotificationSoundSettings = useCallback(async () => {
    setPermissionMessage(undefined);

    const result = await openActiveReminderNotificationSettings();

    if (result.destination === 'app_notifications') {
      setPermissionMessage('Open Active hydration reminders to change the reminder tone.');
    }

    if (result.destination === 'app_settings') {
      setPermissionMessage(
        'Open Notifications, then Active hydration reminders, to change the tone.',
      );
    }

    if (result.destination === 'failed') {
      setPermissionMessage('Android notification sound settings could not be opened.');
    }

    if (result.destination === 'unsupported') {
      setPermissionMessage('Notification sound changes are available on Android.');
    }
  }, []);

  const updateDefaultSnooze = useCallback((defaultSnoozeMinutes: ReminderSnoozeMinutes) => {
    setPreferences((currentPreferences) =>
      updateDefaultSnoozePreference(currentPreferences, defaultSnoozeMinutes),
    );
  }, []);

  const pause = useCallback(
    async (option: ReminderPauseOption) => {
      setPreferences(await pauseReminders(preferences, option));
      await playReminderPauseHaptic();
    },
    [preferences],
  );

  const resume = useCallback(() => {
    setPreferences(resumeReminders(preferences));
  }, [preferences]);

  return {
    pause,
    permissionMessage,
    preferences,
    preview,
    resume,
    status,
    summary,
    toggleEnabled,
    updateDefaultSnooze,
    updateInterval,
    updateMode,
    openNotificationSoundSettings,
    updateSleepTime,
    updateSnoozeEnabled,
    updateVibration,
    updateWakeTime,
  };
};

const mergeScheduleOwnedPreferenceFields = (
  currentPreferences: ReminderPreferences,
  reconciledPreferences: ReminderPreferences,
): ReminderPreferences => {
  return {
    ...currentPreferences,
    pendingSnoozeNotificationId: reconciledPreferences.pendingSnoozeNotificationId,
    pendingSnoozeTargetIso: reconciledPreferences.pendingSnoozeTargetIso,
    scheduledNotificationIds: reconciledPreferences.scheduledNotificationIds,
    timezone: reconciledPreferences.timezone,
  };
};
