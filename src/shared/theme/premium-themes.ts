import type { AppTheme } from './theme';
import { premiumPalettes } from './premium-palettes';
import { weightedThemeFont } from './theme-fonts';

export const premiumThemes = [
  {
    id: 'default',
    name: 'Ocean',
    description: 'The original calm.',
    fontName: 'System',
    bodyFont: 'System',
    displayFont: 'System',
    iconStyle: 'original',
    iconLabel: 'Classic icons',
    motif: 'water',
    light: '#007A8A',
    dark: '#8DDDD3',
    tint: '#D8F3EF',
  },
  {
    id: 'expressive',
    name: 'Material Expressive',
    description: 'Playful shapes. Confident color.',
    fontName: 'Google Sans Flex',
    bodyFont: 'WR-Sans-Regular',
    displayFont: 'WR-Sans-Bold',
    iconStyle: 'material',
    iconLabel: 'Material icons',
    motif: 'star-four-points',
    light: premiumPalettes.expressive.light.primary,
    dark: premiumPalettes.expressive.dark.primary,
    tint: premiumPalettes.expressive.light.primaryContainer,
  },
  {
    id: 'jade',
    name: 'Jade',
    description: 'A softer, greener daily ritual.',
    fontName: 'Nunito',
    bodyFont: 'WR-Rounded-Regular',
    displayFont: 'WR-Rounded-Bold',
    iconStyle: 'outline',
    iconLabel: 'Outline icons',
    motif: 'leaf',
    light: premiumPalettes.jade.light.primary,
    dark: premiumPalettes.jade.dark.primary,
    tint: premiumPalettes.jade.light.primaryContainer,
  },
  {
    id: 'violet',
    name: 'Dusk',
    description: 'Lavender tones, after-hours calm.',
    fontName: 'Google Sans Flex',
    bodyFont: 'WR-Sans-Regular',
    displayFont: 'WR-Sans-Bold',
    iconStyle: 'filled',
    iconLabel: 'Filled icons',
    motif: 'weather-night',
    light: premiumPalettes.violet.light.primary,
    dark: premiumPalettes.violet.dark.primary,
    tint: premiumPalettes.violet.light.primaryContainer,
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Warm color with an editorial touch.',
    fontName: 'Lora + Google Sans Flex',
    bodyFont: 'WR-Sans-Regular',
    displayFont: 'WR-Serif-Bold',
    iconStyle: 'outline',
    iconLabel: 'Outline icons',
    motif: 'flower-outline',
    light: premiumPalettes.rose.light.primary,
    dark: premiumPalettes.rose.dark.primary,
    tint: premiumPalettes.rose.light.primaryContainer,
  },
] as const;

export type PremiumThemeId = (typeof premiumThemes)[number]['id'];
export const isPremiumThemeId = (id: unknown): id is PremiumThemeId =>
  premiumThemes.some((item) => item.id === id);

export const applyPremiumTheme = (base: AppTheme, id: string, fontsReady = true): AppTheme => {
  const variant = premiumThemes.find((theme) => theme.id === id);
  if (!variant || variant.id === 'default')
    return {
      ...base,
      app: { ...base.app, presentation: { ...base.app.presentation, fontsReady } },
    };
  const p = premiumPalettes[variant.id][base.dark ? 'dark' : 'light'];
  const body = fontsReady ? variant.bodyFont : base.app.typography.fontFamily.body;
  const display = fontsReady ? variant.displayFont : base.app.typography.fontFamily.display;
  const fonts = Object.fromEntries(
    Object.entries(base.fonts).map(([key, value]) => {
      const family = /^(display|headline|title)/.test(key) ? display : body;
      return [
        key,
        {
          ...value,
          fontFamily: weightedThemeFont(family, value.fontWeight),
          ...(fontsReady ? { fontWeight: 'normal' } : {}),
        },
      ];
    }),
  ) as AppTheme['fonts'];
  return {
    ...base,
    roundness: variant.id === 'expressive' ? 6 : 4,
    fonts,
    colors: {
      ...base.colors,
      ...p,
      onSurfaceDisabled: `${p.onSurface}61`,
      surfaceDisabled: `${p.onSurface}1f`,
      backdrop: `${p.scrim}66`,
      elevation: {
        level0: 'transparent',
        level1: p.surfaceContainerLow,
        level2: p.surfaceContainer,
        level3: p.surfaceContainerHigh,
        level4: p.surfaceContainerHigh,
        level5: p.surfaceContainerHighest,
      },
    },
    app: {
      ...base.app,
      presentation: {
        id: variant.id,
        iconStyle: variant.iconStyle,
        surfaceStyle: variant.id === 'expressive' ? 'tonal' : 'glass',
        fontsReady,
        backdrop: {
          first: p.primaryContainer,
          second: p.tertiaryContainer,
          highlight: p.secondaryContainer,
        },
      },
      radius:
        variant.id === 'expressive'
          ? { ...base.app.radius, sm: 16, md: 28, lg: 32, xl: 40 }
          : {
              ...base.app.radius,
              md: variant.id === 'jade' ? 22 : variant.id === 'rose' ? 14 : 18,
            },
      typography: {
        ...base.app.typography,
        fontFamily: { body, display, label: body, regular: body },
      },
      colors: {
        ...base.app.colors,
        actionPrimary: p.primary,
        actionSecondary: p.secondary,
        hydrationProgress: p.primary,
        hydrationComplete: p.tertiary,
        surfaceBase: p.background,
        surfaceSubtle: p.surfaceContainerHigh,
        textPrimary: p.onSurface,
        textSecondary: p.onSurfaceVariant,
        borderSubtle: p.outlineVariant,
        statusError: p.error,
      },
    },
  };
};
