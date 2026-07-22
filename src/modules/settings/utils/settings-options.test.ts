import { describe, expect, it } from '@jest/globals';

import {
  formatMeasurementAmount,
  getThemeLabel,
  isMeasurementUnit,
  isThemePreference,
  isTimeValue,
  millilitersToOunces,
  ouncesToMilliliters,
} from './settings-options';

describe('settings options', () => {
  it('validates persisted option values', () => {
    expect(isMeasurementUnit('ml')).toBe(true);
    expect(isMeasurementUnit('oz')).toBe(true);
    expect(isMeasurementUnit('cup')).toBe(false);
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isTimeValue('06:00')).toBe(true);
    expect(isTimeValue('24:00')).toBe(false);
  });

  it('converts hydration amounts between ml and oz', () => {
    expect(millilitersToOunces(250)).toBeCloseTo(8.45, 2);
    expect(ouncesToMilliliters(8)).toBe(237);
    expect(formatMeasurementAmount(500, 'ml')).toBe('500 ml');
    expect(formatMeasurementAmount(250, 'oz')).toBe('8.45 oz');
    expect(formatMeasurementAmount(500, 'oz')).toBe('16.91 oz');
  });

  it('returns readable theme labels', () => {
    expect(getThemeLabel('system')).toBe('System');
    expect(getThemeLabel('light')).toBe('Light');
    expect(getThemeLabel('dark')).toBe('Dark');
  });
});
