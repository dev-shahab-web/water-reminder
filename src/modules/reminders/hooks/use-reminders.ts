import { useCallback, useEffect, useMemo, useState } from 'react';

import { playErrorHaptic, playReminderPauseHaptic } from '@platform/haptics';
import { getNotificationRegistrationStatus } from '@platform/notifications';

import type { ReminderIntervalMinutes, ReminderPauseOption, ReminderPreferences } from '../types';
import {
  disableReminders,
  enableReminders,
  getReminderStatus,
  loadReminderPreferences,
  pauseReminders,
  reconcileReminderSchedule,
  resumeReminders,
  updateReminderSchedulePreference,
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

    if (!preferences.enabled) {
      return 'Reminders are off.';
    }

    if (status === 'paused') {
      return 'Paused for now.';
    }

    if (status === 'complete') {
      return 'Done for today. Reminders are quiet.';
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
      setPreferences(await disableReminders(preferences));
      return;
    }

    const result = await enableReminders(preferences);
    setPreferences(result.preferences);
    setHasPermission(result.granted);

    if (!result.granted) {
      setPermissionMessage('Notifications are blocked. Manual tracking still works.');
      await playErrorHaptic();
    }
  }, [preferences]);

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
    updateInterval,
    updateSleepTime,
    updateWakeTime,
  };
};
