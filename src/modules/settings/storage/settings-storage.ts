import { getStorage } from '@platform/storage';

import type { SettingsState } from '../types';
import {
  defaultSettings,
  isMeasurementUnit,
  isThemePreference,
  isTimeValue,
} from '../utils/settings-options';

export const settingsStorageKeys = {
  measurementUnit: 'settingsMeasurementUnit',
  reduceMotion: 'settingsReduceMotion',
  startOfDay: 'settingsStartOfDay',
  themePreference: 'settingsThemePreference',
} as const;

const subscribers = new Set<() => void>();
let cachedSettingsState: SettingsState | undefined;

const areSettingsEqual = (left: SettingsState, right: SettingsState): boolean => {
  return (
    left.measurementUnit === right.measurementUnit &&
    left.reduceMotion === right.reduceMotion &&
    left.startOfDay === right.startOfDay &&
    left.themePreference === right.themePreference
  );
};

const notifySubscribers = () => {
  subscribers.forEach((subscriber) => {
    subscriber();
  });
};

export const subscribeToSettings = (subscriber: () => void): (() => void) => {
  subscribers.add(subscriber);

  return () => {
    subscribers.delete(subscriber);
  };
};

const readSettingsState = (): SettingsState => {
  const storage = getStorage();
  const measurementUnit = storage.getString(settingsStorageKeys.measurementUnit);
  const themePreference = storage.getString(settingsStorageKeys.themePreference);
  const startOfDay = storage.getString(settingsStorageKeys.startOfDay);

  return {
    measurementUnit: isMeasurementUnit(measurementUnit)
      ? measurementUnit
      : defaultSettings.measurementUnit,
    reduceMotion:
      storage.getBoolean(settingsStorageKeys.reduceMotion) ?? defaultSettings.reduceMotion,
    startOfDay: isTimeValue(startOfDay) ? startOfDay : defaultSettings.startOfDay,
    themePreference: isThemePreference(themePreference)
      ? themePreference
      : defaultSettings.themePreference,
  };
};

export const getSettingsState = (): SettingsState => {
  const nextState = readSettingsState();

  if (cachedSettingsState !== undefined && areSettingsEqual(cachedSettingsState, nextState)) {
    return cachedSettingsState;
  }

  cachedSettingsState = nextState;

  return nextState;
};

export const setSettingsState = (settings: SettingsState): SettingsState => {
  const storage = getStorage();

  storage.set(settingsStorageKeys.measurementUnit, settings.measurementUnit);
  storage.set(settingsStorageKeys.reduceMotion, settings.reduceMotion);
  storage.set(settingsStorageKeys.startOfDay, settings.startOfDay);
  storage.set(settingsStorageKeys.themePreference, settings.themePreference);
  cachedSettingsState = settings;
  notifySubscribers();

  return settings;
};

export const updateSettingsState = (updates: Partial<SettingsState>): SettingsState => {
  return setSettingsState({
    ...getSettingsState(),
    ...updates,
  });
};
