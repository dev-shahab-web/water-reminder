import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';

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
  const isDark = colorScheme === 'dark';

  const paperTheme = useMemo(() => (isDark ? appDarkTheme : appLightTheme), [isDark]);
  const navigationTheme = useMemo(
    () => (isDark ? navigationDarkTheme : navigationLightTheme),
    [isDark],
  );

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
