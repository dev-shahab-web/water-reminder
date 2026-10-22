import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'expo-router';
import { type PropsWithChildren, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';

import { getSettingsState, subscribeToSettings } from '@modules/settings/storage/settings-storage';
import { WidgetLiveSync } from '@modules/widgets';
import { WearRuntime } from '@modules/wear/components/wear-runtime';
import { usePremiumAccess } from '@modules/premium/hooks/use-premium-access';
import { PremiumRuntime } from '@modules/premium/components/premium-runtime';
import { useAppSelector } from '@state/store/hooks';
import { applyPremiumTheme } from '@shared/theme/premium-themes';
import { themeFontAssets } from '@shared/theme/theme-fonts';
import { logger } from '@core/logger';
import { queryClient } from '@query/client';
import {
  appDarkTheme,
  appLightTheme,
  navigationDarkTheme,
  navigationLightTheme,
} from '@shared/theme';
import { PaperMaterialCommunityIcon } from '@shared/components/material-community-icon';
import { store } from '@state/store';
import { MotionProvider } from '@shared/motion/motion-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <ThemedProviders>{children}</ThemedProviders>
    </ReduxProvider>
  );
}

function ThemedProviders({ children }: PropsWithChildren) {
  const [fontsReady, fontError] = useFonts(themeFontAssets);
  useEffect(() => {
    if (fontError) logger.warn('Theme fonts unavailable; using system typography.');
  }, [fontError]);
  const colorScheme = useColorScheme();
  const settings = useSyncExternalStore(subscribeToSettings, getSettingsState, getSettingsState);
  const isDark =
    settings.themePreference === 'system'
      ? colorScheme === 'dark'
      : settings.themePreference === 'dark';

  const { preferences } = useAppSelector((state) => state.premium);
  const active = usePremiumAccess();
  const premiumTheme = active ? preferences.theme : 'default';
  const paperTheme = useMemo(
    () => applyPremiumTheme(isDark ? appDarkTheme : appLightTheme, premiumTheme, fontsReady),
    [isDark, premiumTheme, fontsReady],
  );
  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? navigationDarkTheme : navigationLightTheme),
      colors: {
        ...(isDark ? navigationDarkTheme : navigationLightTheme).colors,
        background: paperTheme.colors.background,
        card: paperTheme.colors.surface,
        primary: paperTheme.colors.primary,
        text: paperTheme.colors.onSurface,
        border: paperTheme.app.colors.borderSubtle,
        notification: paperTheme.colors.error,
      },
    }),
    [isDark, paperTheme],
  );
  const paperSettings = useMemo(
    () => ({
      icon: PaperMaterialCommunityIcon,
    }),
    [],
  );

  return (
    <>
      <PremiumRuntime />
      <WidgetLiveSync />
      <WearRuntime />
      <QueryClientProvider client={queryClient}>
        <PaperProvider settings={paperSettings} theme={paperTheme}>
          <MotionProvider reduceMotion={settings.reduceMotion}>
            <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
          </MotionProvider>
        </PaperProvider>
      </QueryClientProvider>
    </>
  );
}
