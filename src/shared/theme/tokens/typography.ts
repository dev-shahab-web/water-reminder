import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    body: 'System',
    display: Platform.select({
      android: 'sans-serif-medium',
      default: 'System',
      ios: 'Avenir Next',
    }),
    label: 'System',
    regular: 'System',
  },
  fontSize: {
    body: 16,
    caption: 12,
    display: 34,
    label: 14,
    subtitle: 18,
    title: 24,
  },
  fontWeight: {
    bold: '700',
    heavy: '800',
    medium: '500',
    regular: '400',
    semibold: '600',
  },
  lineHeight: {
    body: 24,
    caption: 16,
    display: 40,
    label: 20,
    subtitle: 26,
    title: 32,
  },
} as const;
