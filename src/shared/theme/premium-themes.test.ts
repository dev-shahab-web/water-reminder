import { describe, expect, it } from '@jest/globals';
import { themedTextStyle } from '@shared/components/themed-text';
import { appDarkTheme, appLightTheme } from './theme';
import { applyPremiumTheme, premiumThemes } from './premium-themes';

const luminance = (hex: string) => {
  const values = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};

describe('premium theme readability', () => {
  for (const preset of premiumThemes.filter((item) => item.id !== 'default')) {
    it.each([appLightTheme, appDarkTheme])(
      `${preset.name} keeps controls, surfaces and water text readable (dark: $dark)`,
      (base) => {
        const { colors: c } = applyPremiumTheme(base, preset.id);
        for (const [foreground, background] of [
          [c.onPrimary, c.primary],
          [c.onSecondary, c.secondary],
          [c.onTertiary, c.tertiary],
          [c.onPrimaryContainer, c.primaryContainer],
          [c.onSecondaryContainer, c.secondaryContainer],
          [c.onTertiaryContainer, c.tertiaryContainer],
          [c.onSurface, c.surface],
          [c.onSurfaceVariant, c.elevation.level3],
          [c.onSurfaceVariant, c.primaryContainer],
          [c.onSurfaceVariant, c.secondaryContainer],
          [c.onError, c.error],
        ]) {
          const [high, low] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
          expect((high + 0.05) / (low + 0.05)).toBeGreaterThanOrEqual(4.5);
        }
      },
    );
  }

  it('uses bundled heading/body weights while preserving intentional custom fonts', () => {
    const rose = applyPremiumTheme(appLightTheme, 'rose');
    expect(themedTextStyle(rose, { fontSize: 28, fontWeight: '700' })).toMatchObject({
      fontFamily: 'WR-Serif-Bold',
      fontWeight: 'normal',
    });
    expect(themedTextStyle(rose, { fontSize: 14, fontWeight: '600' })).toMatchObject({
      fontFamily: 'WR-Sans-Semibold',
    });
    expect(themedTextStyle(rose, { fontFamily: 'monospace' })).toBeUndefined();
    expect(themedTextStyle(appLightTheme, { fontSize: 28 })).toBeUndefined();
  });

  it('keeps system typography available before assets load and leaves Ocean intact', () => {
    const before = JSON.stringify(appLightTheme);
    const unloaded = applyPremiumTheme(appLightTheme, 'expressive', false);
    expect(unloaded.app.typography.fontFamily).toEqual(appLightTheme.app.typography.fontFamily);
    expect(themedTextStyle(unloaded, { fontWeight: '700' })).toBeUndefined();
    expect(applyPremiumTheme(appLightTheme, 'invalid').colors).toEqual(appLightTheme.colors);
    expect(JSON.stringify(appLightTheme)).toBe(before);
  });
});
