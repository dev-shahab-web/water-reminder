import { DarkTheme, DefaultTheme } from 'expo-router';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import {
  darkColors,
  darkSemanticColors,
  elevation,
  lightColors,
  lightSemanticColors,
  radius,
  spacing,
  typography,
  type AppSemanticColors,
} from './tokens';

type NavigationTheme = typeof DefaultTheme;

export type AppTheme = MD3Theme & {
  app: {
    colors: AppSemanticColors;
    elevation: typeof elevation;
    radius: typeof radius;
    spacing: typeof spacing;
    typography: typeof typography;
  };
};

const appTokens = {
  elevation,
  radius,
  spacing,
  typography,
} as const;

export const appLightTheme: AppTheme = {
  ...MD3LightTheme,
  app: {
    ...appTokens,
    colors: lightSemanticColors,
  },
  colors: {
    ...MD3LightTheme.colors,
    background: lightColors.background,
    error: lightColors.error,
    onBackground: lightColors.onBackground,
    onPrimary: lightColors.onPrimary,
    onSurface: lightColors.onSurface,
    onSurfaceVariant: lightColors.onSurfaceVariant,
    outline: lightColors.border,
    primary: lightColors.primary,
    primaryContainer: lightColors.primaryContainer,
    secondary: lightColors.secondary,
    secondaryContainer: lightColors.secondaryContainer,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceMuted,
  },
};

export const appDarkTheme: AppTheme = {
  ...MD3DarkTheme,
  app: {
    ...appTokens,
    colors: darkSemanticColors,
  },
  colors: {
    ...MD3DarkTheme.colors,
    background: darkColors.background,
    error: darkColors.error,
    onBackground: darkColors.onBackground,
    onPrimary: darkColors.onPrimary,
    onSurface: darkColors.onSurface,
    onSurfaceVariant: darkColors.onSurfaceVariant,
    outline: darkColors.border,
    primary: darkColors.primary,
    primaryContainer: darkColors.primaryContainer,
    secondary: darkColors.secondary,
    secondaryContainer: darkColors.secondaryContainer,
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceMuted,
  },
};

export const navigationLightTheme: NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: lightColors.background,
    border: lightColors.border,
    card: lightColors.surface,
    notification: lightColors.error,
    primary: lightColors.primary,
    text: lightColors.onBackground,
  },
};

export const navigationDarkTheme: NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: darkColors.background,
    border: darkColors.border,
    card: darkColors.surface,
    notification: darkColors.error,
    primary: darkColors.primary,
    text: darkColors.onBackground,
  },
};
