import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'expo-router';
import { type PropsWithChildren, useMemo, useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';

import { getSettingsState, subscribeToSettings } from '@modules/settings/storage/settings-storage';
import { WidgetLiveSync } from '@modules/widgets';
import { queryClient } from '@query/client';
import {
  appDarkTheme,
  appLightTheme,
  navigationDarkTheme,
  navigationLightTheme,
} from '@shared/theme';
import { store } from '@state/store';

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const settings = useSyncExternalStore(subscribeToSettings, getSettingsState, getSettingsState);
  const isDark =
    settings.themePreference === 'system'
      ? colorScheme === 'dark'
      : settings.themePreference === 'dark';

  const paperTheme = useMemo(() => (isDark ? appDarkTheme : appLightTheme), [isDark]);
  const navigationTheme = useMemo(
    () => (isDark ? navigationDarkTheme : navigationLightTheme),
    [isDark],
  );

  return (
    <ReduxProvider store={store}>
      <WidgetLiveSync />
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
