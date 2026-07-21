import { useCallback, useEffect, useMemo, useState } from 'react';

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
import { calculateReminderSchedule } from '../utils/scheduler';
import { formatReminderTime } from '../utils/time';

type UseRemindersInput = {
  goalAmount: number;
  totalAmount: number;
};

export const useReminders = ({ goalAmount, totalAmount }: UseRemindersInput) => {
  const [preferences, setPreferences] = useState<ReminderPreferences>(() =>
    loadReminderPreferences(),
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | undefined>();

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

    const reconcile = async () => {
      const nextPreferences = await reconcileReminderSchedule({
        goalAmount,
        preferences,
        totalAmount,
      });

      if (isMounted) {
        setPreferences(nextPreferences);
      }
    };

    void reconcile();

    return () => {
      isMounted = false;
    };
  }, [goalAmount, hasPermission, preferences, totalAmount]);

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

  const updateInterval = useCallback(
    (intervalMinutes: ReminderIntervalMinutes) => {
      setPreferences(updateReminderSchedulePreference(preferences, { intervalMinutes }));
    },
    [preferences],
  );

  const updateWakeTime = useCallback(
    (wakeTime: string) => {
      setPreferences(updateReminderSchedulePreference(preferences, { wakeTime }));
    },
    [preferences],
  );

  const updateSleepTime = useCallback(
    (sleepTime: string) => {
      setPreferences(updateReminderSchedulePreference(preferences, { sleepTime }));
    },
    [preferences],
  );

  const updateMode = useCallback(
    (mode: ReminderMode) => {
      setPreferences(updateReminderModePreference(preferences, mode));
    },
    [preferences],
  );

  const updateVibration = useCallback(
    (vibrationEnabled: boolean) => {
      setPreferences(updateReminderVibrationPreference(preferences, vibrationEnabled));
    },
    [preferences],
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

  const updateSnoozeEnabled = useCallback(
    (snoozeEnabled: boolean) => {
      setPreferences(updateReminderSnoozePreference(preferences, snoozeEnabled));
    },
    [preferences],
  );

  const updateDefaultSnooze = useCallback(
    (defaultSnoozeMinutes: ReminderSnoozeMinutes) => {
      setPreferences(updateDefaultSnoozePreference(preferences, defaultSnoozeMinutes));
    },
    [preferences],
  );

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
