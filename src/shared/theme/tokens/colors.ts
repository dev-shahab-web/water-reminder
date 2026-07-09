export const palette = {
  black: '#000000',
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#2563EB',
    600: '#1D4ED8',
    700: '#1E40AF',
  },
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    500: '#64748B',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  green: {
    500: '#16A34A',
    600: '#15803D',
  },
  red: {
    500: '#DC2626',
    600: '#B91C1C',
  },
  white: '#FFFFFF',
} as const;

export const lightColors = {
  background: palette.gray[50],
  border: palette.gray[200],
  error: palette.red[600],
  onBackground: palette.gray[900],
  onPrimary: palette.white,
  onSurface: palette.gray[900],
  primary: palette.blue[600],
  primaryContainer: palette.blue[100],
  success: palette.green[600],
  surface: palette.white,
  surfaceMuted: palette.gray[100],
  textMuted: palette.gray[500],
} as const;

export const darkColors = {
  background: palette.gray[900],
  border: palette.gray[700],
  error: palette.red[500],
  onBackground: palette.gray[50],
  onPrimary: palette.white,
  onSurface: palette.gray[50],
  primary: palette.blue[500],
  primaryContainer: palette.blue[700],
  success: palette.green[500],
  surface: palette.gray[800],
  surfaceMuted: palette.gray[700],
  textMuted: palette.gray[300],
} as const;
