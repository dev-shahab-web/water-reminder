import Constants from 'expo-constants';

import { scheduleLocalNotification } from '@platform/notifications';
import { setTelemetryEnabled, trackEvent } from '@platform/telemetry';

import { getSettingsState, updateSettingsState } from '../storage/settings-storage';
import type { MeasurementUnit, SettingsState, ThemePreference } from '../types';
import { isTimeValue, ouncesToMilliliters } from '../utils/settings-options';

type AppInformation = {
  buildNumber: string;
  version: string;
};

export const loadSettings = (): SettingsState => {
  return getSettingsState();
};

export const saveMeasurementUnit = (measurementUnit: MeasurementUnit): SettingsState => {
  return updateSettingsState({ measurementUnit });
};

export const saveThemePreference = (themePreference: ThemePreference): SettingsState => {
  trackEvent('theme_changed', { theme: themePreference });
  return updateSettingsState({ themePreference });
};

export const saveReduceMotion = (reduceMotion: boolean): SettingsState => {
  trackEvent('reduce_motion_changed');
  return updateSettingsState({ reduceMotion });
};

export const saveShareAnonymousDiagnostics = async (
  shareAnonymousDiagnostics: boolean,
): Promise<SettingsState> => {
  const nextState = updateSettingsState({ shareAnonymousDiagnostics });
  await setTelemetryEnabled(shareAnonymousDiagnostics);
  return nextState;
};

export const saveStartOfDay = (startOfDay: string): SettingsState => {
  if (!isTimeValue(startOfDay)) {
    throw new Error('Start of day must use HH:mm format.');
  }

  return updateSettingsState({ startOfDay });
};

export const getGoalAmountInUnit = (goalMl: number, unit: MeasurementUnit): number => {
  if (unit === 'oz') {
    return Math.round(goalMl / 29.5735);
  }

  return goalMl;
};

export const getGoalAmountInMilliliters = (amount: number, unit: MeasurementUnit): number => {
  return unit === 'oz' ? ouncesToMilliliters(amount) : amount;
};

export const getAppInformation = (): AppInformation => {
  const expoConfig = Constants.expoConfig;

  return {
    buildNumber:
      expoConfig?.android?.versionCode === undefined
        ? 'Local build'
        : String(expoConfig.android.versionCode),
    version: expoConfig?.version ?? '1.0.0',
  };
};

export const sendTestReminderNotification = async (): Promise<boolean> => {
  const identifier = await scheduleLocalNotification({
    body: 'A calm reminder preview from Water Reminder.',
    date: new Date(Date.now() + 2000),
    title: 'Time for some water.',
  });

  return identifier !== undefined;
};
