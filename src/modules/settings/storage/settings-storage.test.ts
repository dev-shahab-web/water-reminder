import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  getSettingsState,
  settingsStorageKeys,
  subscribeToSettings,
  updateSettingsState,
} from './settings-storage';

const mockStorageValues = new Map<string, boolean | number | string>();

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
    },
    set: (key: string, value: boolean | number | string) => {
      mockStorageValues.set(key, value);
    },
  }),
}));

describe('settings storage', () => {
  beforeEach(() => {
    mockStorageValues.clear();
  });

  it('returns calm defaults when no settings are persisted', () => {
    expect(getSettingsState()).toEqual({
      measurementUnit: 'ml',
      reduceMotion: false,
      shareAnonymousDiagnostics: false,
      startOfDay: '00:00',
      themePreference: 'system',
    });
  });

  it('returns a stable snapshot when persisted values have not changed', () => {
    const firstSnapshot = getSettingsState();
    const secondSnapshot = getSettingsState();

    expect(secondSnapshot).toBe(firstSnapshot);
  });

  it('persists theme, unit, start of day, and reduce motion settings', () => {
    updateSettingsState({
      measurementUnit: 'oz',
      reduceMotion: true,
      shareAnonymousDiagnostics: true,
      startOfDay: '06:00',
      themePreference: 'dark',
    });

    expect(mockStorageValues.get(settingsStorageKeys.measurementUnit)).toBe('oz');
    expect(mockStorageValues.get(settingsStorageKeys.reduceMotion)).toBe(true);
    expect(mockStorageValues.get(settingsStorageKeys.shareAnonymousDiagnostics)).toBe(true);
    expect(mockStorageValues.get(settingsStorageKeys.startOfDay)).toBe('06:00');
    expect(mockStorageValues.get(settingsStorageKeys.themePreference)).toBe('dark');
    expect(getSettingsState()).toEqual({
      measurementUnit: 'oz',
      reduceMotion: true,
      shareAnonymousDiagnostics: true,
      startOfDay: '06:00',
      themePreference: 'dark',
    });
  });

  it('notifies mounted settings consumers after updates', () => {
    const subscriber = jest.fn();
    const unsubscribe = subscribeToSettings(subscriber);

    updateSettingsState({ themePreference: 'light' });
    unsubscribe();
    updateSettingsState({ themePreference: 'dark' });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid persisted settings', () => {
    mockStorageValues.set(settingsStorageKeys.measurementUnit, 'cup');
    mockStorageValues.set(settingsStorageKeys.startOfDay, '25:00');
    mockStorageValues.set(settingsStorageKeys.themePreference, 'sepia');

    expect(getSettingsState()).toEqual({
      measurementUnit: 'ml',
      reduceMotion: false,
      shareAnonymousDiagnostics: false,
      startOfDay: '00:00',
      themePreference: 'system',
    });
  });
});
