import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'expo-router';
import { type PropsWithChildren, useMemo, useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';

import { getSettingsState, subscribeToSettings } from '@modules/settings/storage/settings-storage';
import { WidgetLiveSync } from '@modules/widgets';
import { PremiumRuntime } from '@modules/premium/components/premium-runtime';
import { useAppSelector } from '@state/store/hooks';
import { applyPremiumTheme } from '@shared/theme/premium-themes';
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
  const colorScheme = useColorScheme();
  const settings = useSyncExternalStore(subscribeToSettings, getSettingsState, getSettingsState);
  const isDark =
    settings.themePreference === 'system'
      ? colorScheme === 'dark'
      : settings.themePreference === 'dark';

  const { access, preferences } = useAppSelector((state) => state.premium);
  const premiumTheme = access.active ? preferences.theme : 'default';
  const paperTheme = useMemo(
    () => applyPremiumTheme(isDark ? appDarkTheme : appLightTheme, premiumTheme),
    [isDark, premiumTheme],
  );
  const navigationTheme = useMemo(
    () => (isDark ? navigationDarkTheme : navigationLightTheme),
    [isDark],
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
