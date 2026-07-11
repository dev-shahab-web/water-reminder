import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { useAppDispatch, useAppSelector } from '@state/store/hooks';
import { loadTodayHydration } from '@modules/hydration';
import {
  getOnboardingState,
  setHydrationGoal,
} from '@modules/onboarding/repository/onboarding-storage';
import { useReminders } from '@modules/reminders';

import {
  exportHydrationDatabase,
  formatDatabaseSize,
  getSettingsDataSummary,
  importHydrationDatabase,
  deleteHydrationHistory,
} from '../services/settings-data-service';
import {
  getAppInformation,
  getGoalAmountInMilliliters,
  getGoalAmountInUnit,
  saveMeasurementUnit,
  saveReduceMotion,
  saveStartOfDay,
  saveThemePreference,
  sendTestReminderNotification,
} from '../services/settings-service';
import { getSettingsState, subscribeToSettings } from '../storage/settings-storage';
import type { MeasurementUnit, ThemePreference } from '../types';

export const useSettingsSnapshot = () => {
  return useSyncExternalStore(subscribeToSettings, getSettingsState, getSettingsState);
};

export const useSettings = () => {
  const settings = useSettingsSnapshot();
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.hydration.entries);
  const [goalAmountMl, setGoalAmountMl] = useState(() => getOnboardingState().hydrationGoal);
  const [dataSummary, setDataSummary] = useState({
    databaseSizeBytes: 0,
    totalEntries: 0,
  });
  const [exportPayload, setExportPayload] = useState<string | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);
  const totalAmount = useMemo(
    () => entries.reduce((total, entry) => total + entry.amount, 0),
    [entries],
  );
  const reminders = useReminders({
    goalAmount: goalAmountMl,
    totalAmount,
  });

  const refreshDataSummary = useCallback(async () => {
    const summary = await getSettingsDataSummary();
    setDataSummary(summary);
  }, []);

  useEffect(() => {
    void dispatch(loadTodayHydration());
    let isMounted = true;

    const loadSummary = async () => {
      const summary = await getSettingsDataSummary();

      if (isMounted) {
        setDataSummary(summary);
      }
    };

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const updateThemePreference = useCallback((themePreference: ThemePreference) => {
    saveThemePreference(themePreference);
  }, []);

  const updateMeasurementUnit = useCallback((measurementUnit: MeasurementUnit) => {
    saveMeasurementUnit(measurementUnit);
  }, []);

  const updateReduceMotion = useCallback((reduceMotion: boolean) => {
    saveReduceMotion(reduceMotion);
  }, []);

  const updateStartOfDay = useCallback((startOfDay: string) => {
    saveStartOfDay(startOfDay);
  }, []);

  const updateGoalAmount = useCallback(
    (amountInCurrentUnit: number) => {
      const nextGoal = getGoalAmountInMilliliters(amountInCurrentUnit, settings.measurementUnit);
      const nextState = setHydrationGoal(nextGoal);
      setGoalAmountMl(nextState.hydrationGoal);
      setStatusMessage('Daily goal updated.');
    },
    [settings.measurementUnit],
  );

  const prepareExport = useCallback(async () => {
    setIsBusy(true);
    try {
      const payload = await exportHydrationDatabase();
      setExportPayload(payload);
      setStatusMessage('Your local export is ready.');
    } finally {
      setIsBusy(false);
    }
  }, []);

  const importDatabase = useCallback(
    async (payload: string) => {
      setIsBusy(true);
      try {
        const count = await importHydrationDatabase(payload);
        setExportPayload(undefined);
        setStatusMessage(`${count} entries imported.`);
        await refreshDataSummary();
        void dispatch(loadTodayHydration());
      } finally {
        setIsBusy(false);
      }
    },
    [dispatch, refreshDataSummary],
  );

  const resetHistory = useCallback(async () => {
    setIsBusy(true);
    try {
      await deleteHydrationHistory();
      setStatusMessage('Hydration history reset.');
      await refreshDataSummary();
      void dispatch(loadTodayHydration());
    } finally {
      setIsBusy(false);
    }
  }, [dispatch, refreshDataSummary]);

  const sendTestNotification = useCallback(async () => {
    setIsBusy(true);
    try {
      const didSchedule = await sendTestReminderNotification();
      setStatusMessage(
        didSchedule
          ? 'Test reminder scheduled.'
          : 'Test reminder could not be scheduled right now.',
      );
    } finally {
      setIsBusy(false);
    }
  }, []);

  return {
    appInformation: getAppInformation(),
    clearExport: () => {
      setExportPayload(undefined);
    },
    dataSummary: {
      databaseSize: formatDatabaseSize(dataSummary.databaseSizeBytes),
      totalEntries: dataSummary.totalEntries,
    },
    exportPayload,
    goalAmountInUnit: getGoalAmountInUnit(goalAmountMl, settings.measurementUnit),
    importDatabase,
    isBusy,
    prepareExport,
    refreshDataSummary,
    reminders,
    resetHistory,
    sendTestNotification,
    settings,
    statusMessage,
    updateGoalAmount,
    updateMeasurementUnit,
    updateReduceMotion,
    updateStartOfDay,
    updateThemePreference,
  };
};
