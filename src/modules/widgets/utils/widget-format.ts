import type { MeasurementUnit, ThemePreference } from '@modules/settings/types';

export const clampCompletionPercentage = ({
  consumedMl,
  goalMl,
}: {
  consumedMl: number;
  goalMl: number;
}): number => {
  if (goalMl <= 0) {
    return 0;
  }

  return Math.min(Math.round((consumedMl / goalMl) * 100), 999);
};

export const getRemainingMl = ({
  consumedMl,
  goalMl,
}: {
  consumedMl: number;
  goalMl: number;
}): number => {
  return Math.max(goalMl - consumedMl, 0);
};

export const formatWidgetAmount = ({
  amountMl,
  measurementUnit,
}: {
  amountMl: number;
  measurementUnit: MeasurementUnit;
}): string => {
  if (measurementUnit === 'oz') {
    const ounces = amountMl / 29.5735;

    return ounces >= 10 ? `${Math.round(ounces)} oz` : `${ounces.toFixed(1)} oz`;
  }

  if (amountMl >= 1000) {
    const litres = amountMl / 1000;

    return Number.isInteger(litres) ? `${litres} L` : `${litres.toFixed(1)} L`;
  }

  return `${amountMl} ml`;
};

export const resolveWidgetTheme = ({
  colorScheme,
  themePreference,
}: {
  colorScheme: 'dark' | 'light';
  themePreference: ThemePreference;
}): 'dark' | 'light' => {
  if (themePreference === 'system') {
    return colorScheme;
  }

  return themePreference;
};
