import { describe, expect, it } from '@jest/globals';

import { appConfig } from '@core/config';

import { appDarkTheme, appLightTheme } from './theme';
import { lightColors, lightSemanticColors } from './tokens';

describe('Water Reminder experience foundation', () => {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((offset) => {
      const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };

  it.each([appLightTheme, appDarkTheme])(
    'keeps branded container text readable in each theme',
    (theme) => {
      for (const [foreground, background] of [
        [theme.colors.onPrimaryContainer, theme.colors.primaryContainer],
        [theme.colors.onSecondaryContainer, theme.colors.secondaryContainer],
        [theme.colors.onSurface, theme.colors.elevation.level3],
      ]) {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('uses Water Reminder product metadata', () => {
    expect(appConfig.name).toBe('Water Reminder');
    expect(appConfig.motto).toBe('Hydration should become a habit, not a task.');
  });

  it('exposes semantic product colors for UX decisions', () => {
    expect(lightSemanticColors).toMatchObject({
      actionPrimary: expect.any(String),
      hydrationComplete: expect.any(String),
      hydrationPaused: expect.any(String),
      hydrationProgress: expect.any(String),
      surfaceBase: expect.any(String),
      textPrimary: expect.any(String),
    });
  });

  it('maps semantic colors into light and dark app themes', () => {
    expect(appLightTheme.app.colors.hydrationProgress).toBe(lightSemanticColors.hydrationProgress);
    expect(appDarkTheme.app.colors.hydrationProgress).toBeDefined();
  });

  it('pairs the water identity accent with a cool glass backdrop', () => {
    expect(lightColors.primary).toBe('#007A8A');
    expect(lightColors.background).toBe('#EDF3F6');
  });
});
