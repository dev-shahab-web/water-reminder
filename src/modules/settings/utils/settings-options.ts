import type { MeasurementUnit, ThemePreference } from '../types';

export const defaultSettings = {
  measurementUnit: 'ml',
  reduceMotion: false,
  startOfDay: '00:00',
  themePreference: 'system',
} satisfies {
  measurementUnit: MeasurementUnit;
  reduceMotion: boolean;
  startOfDay: string;
  themePreference: ThemePreference;
};

export const isMeasurementUnit = (value: string | undefined): value is MeasurementUnit => {
  return value === 'ml' || value === 'oz';
};

export const isThemePreference = (value: string | undefined): value is ThemePreference => {
  return value === 'system' || value === 'light' || value === 'dark';
};

export const isTimeValue = (value: string | undefined): value is string => {
  return value !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
};

export const millilitersToOunces = (amountMl: number): number => {
  return Math.round(amountMl / 29.5735);
};

export const ouncesToMilliliters = (amountOz: number): number => {
  return Math.round(amountOz * 29.5735);
};

export const formatMeasurementAmount = (amountMl: number, unit: MeasurementUnit): string => {
  if (unit === 'oz') {
    return `${millilitersToOunces(amountMl)} oz`;
  }

  return `${amountMl} ml`;
};

export const getThemeLabel = (preference: ThemePreference): string => {
  switch (preference) {
    case 'dark':
      return 'Dark';
    case 'light':
      return 'Light';
    case 'system':
      return 'System';
  }
};
