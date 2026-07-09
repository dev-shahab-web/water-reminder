import { describe, expect, it } from '@jest/globals';

import { appConfig } from '@core/config';

import { appDarkTheme, appLightTheme } from './theme';
import { lightColors, lightSemanticColors } from './tokens';

describe('Water Reminder experience foundation', () => {
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

  it('replaces starter blue with the water identity palette', () => {
    expect(lightColors.primary).toBe('#007A8A');
    expect(lightColors.background).toBe('#F7FBF8');
  });
});
