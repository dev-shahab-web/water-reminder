import type { AppTheme } from './theme';

export const premiumThemes = [
  { id: 'default', name: 'Ocean', light: '#007A8A', dark: '#8DDDD3', tint: '#D8F3EF' },
  { id: 'jade', name: 'Jade', light: '#276B50', dark: '#9FD7B8', tint: '#DCEFE4' },
  { id: 'violet', name: 'Dusk', light: '#655298', dark: '#C6B6EC', tint: '#EBE4F8' },
  { id: 'rose', name: 'Rose', light: '#94516A', dark: '#F1B6CA', tint: '#F8E3EB' },
] as const;

export const applyPremiumTheme = (base: AppTheme, id: string): AppTheme => {
  const variant = premiumThemes.find((theme) => theme.id === id);
  if (!variant || id === 'default') return base;
  const accent = base.dark ? variant.dark : variant.light;
  const container = base.dark ? `${variant.light}60` : variant.tint;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: accent,
      primaryContainer: container,
      onPrimaryContainer: base.dark ? variant.tint : variant.light,
      secondary: accent,
      secondaryContainer: container,
    },
    app: {
      ...base.app,
      colors: {
        ...base.app.colors,
        actionPrimary: accent,
        actionSecondary: accent,
        hydrationProgress: accent,
        hydrationComplete: accent,
      },
    },
  };
};
