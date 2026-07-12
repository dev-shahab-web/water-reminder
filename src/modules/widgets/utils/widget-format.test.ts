import { describe, expect, it } from '@jest/globals';

import {
  clampCompletionPercentage,
  formatWidgetAmount,
  getRemainingMl,
  resolveWidgetTheme,
} from './widget-format';

describe('widget formatting', () => {
  it('calculates completion and remaining values for the widget snapshot', () => {
    expect(clampCompletionPercentage({ consumedMl: 1250, goalMl: 2500 })).toBe(50);
    expect(clampCompletionPercentage({ consumedMl: 3000, goalMl: 2500 })).toBe(120);
    expect(clampCompletionPercentage({ consumedMl: 3000, goalMl: 0 })).toBe(0);
    expect(getRemainingMl({ consumedMl: 1800, goalMl: 2500 })).toBe(700);
    expect(getRemainingMl({ consumedMl: 2800, goalMl: 2500 })).toBe(0);
  });

  it('formats compact widget amounts using the selected unit', () => {
    expect(formatWidgetAmount({ amountMl: 750, measurementUnit: 'ml' })).toBe('750 ml');
    expect(formatWidgetAmount({ amountMl: 1800, measurementUnit: 'ml' })).toBe('1.8 L');
    expect(formatWidgetAmount({ amountMl: 2000, measurementUnit: 'ml' })).toBe('2 L');
    expect(formatWidgetAmount({ amountMl: 750, measurementUnit: 'oz' })).toBe('25 oz');
    expect(formatWidgetAmount({ amountMl: 250, measurementUnit: 'oz' })).toBe('8.5 oz');
  });

  it('resolves system theme using the supplied platform color scheme', () => {
    expect(resolveWidgetTheme({ colorScheme: 'dark', themePreference: 'system' })).toBe('dark');
    expect(resolveWidgetTheme({ colorScheme: 'light', themePreference: 'system' })).toBe('light');
    expect(resolveWidgetTheme({ colorScheme: 'dark', themePreference: 'light' })).toBe('light');
  });
});
