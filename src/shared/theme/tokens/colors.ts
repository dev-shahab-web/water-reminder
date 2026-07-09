export const palette = {
  black: '#000000',
  clay: {
    200: '#E7D9C4',
    500: '#8E735B',
  },
  coral: {
    500: '#D95F45',
    700: '#A73F2E',
  },
  mist: {
    50: '#F7FBF8',
    100: '#EEF8F5',
    200: '#DFF1EC',
    300: '#C7E6DE',
  },
  moss: {
    400: '#8AA897',
    600: '#4E7B68',
    700: '#345E4F',
  },
  night: {
    50: '#EAF3EF',
    100: '#C9D9D2',
    300: '#8FA59B',
    500: '#52685F',
    700: '#26352F',
    800: '#18221F',
    900: '#101816',
  },
  sand: {
    100: '#F5EFE3',
    300: '#E8D7B9',
  },
  teal: {
    100: '#D8F3EF',
    300: '#8DDDD3',
    500: '#1EA79B',
    600: '#007A8A',
    700: '#075F68',
  },
  white: '#FFFFFF',
} as const;

export const lightColors = {
  background: palette.mist[50],
  border: palette.mist[200],
  error: palette.coral[700],
  onBackground: palette.night[900],
  onPrimary: palette.white,
  onSurface: palette.night[900],
  onSurfaceVariant: palette.night[500],
  primary: palette.teal[600],
  primaryContainer: palette.teal[100],
  secondary: palette.moss[600],
  secondaryContainer: palette.mist[200],
  success: palette.moss[600],
  surface: palette.white,
  surfaceMuted: palette.mist[100],
  textMuted: palette.night[500],
  warning: '#9A6700',
} as const;

export const darkColors = {
  background: palette.night[900],
  border: palette.night[700],
  error: palette.coral[500],
  onBackground: palette.night[50],
  onPrimary: palette.night[900],
  onSurface: palette.night[50],
  onSurfaceVariant: palette.night[300],
  primary: palette.teal[300],
  primaryContainer: palette.teal[700],
  secondary: palette.moss[400],
  secondaryContainer: palette.night[700],
  success: palette.moss[400],
  surface: palette.night[800],
  surfaceMuted: palette.night[700],
  textMuted: palette.night[300],
  warning: palette.sand[300],
} as const;

export const lightSemanticColors = {
  actionPrimary: lightColors.primary,
  actionSecondary: lightColors.secondary,
  borderSubtle: lightColors.border,
  hydrationComplete: lightColors.success,
  hydrationPaused: palette.clay[500],
  hydrationProgress: palette.teal[500],
  statusError: lightColors.error,
  statusWarning: lightColors.warning,
  surfaceBase: lightColors.background,
  surfaceSubtle: lightColors.surfaceMuted,
  textPrimary: lightColors.onBackground,
  textSecondary: lightColors.textMuted,
} as const;

export const darkSemanticColors = {
  actionPrimary: darkColors.primary,
  actionSecondary: darkColors.secondary,
  borderSubtle: darkColors.border,
  hydrationComplete: darkColors.success,
  hydrationPaused: palette.clay[200],
  hydrationProgress: palette.teal[300],
  statusError: darkColors.error,
  statusWarning: darkColors.warning,
  surfaceBase: darkColors.background,
  surfaceSubtle: darkColors.surfaceMuted,
  textPrimary: darkColors.onBackground,
  textSecondary: darkColors.textMuted,
} as const;

export type AppSemanticColorKey = keyof typeof lightSemanticColors;

export type AppSemanticColors = Record<AppSemanticColorKey, string>;
