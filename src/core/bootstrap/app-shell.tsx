import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

export function AppShell() {
  const colorScheme = useColorScheme();
  const theme = useTheme<AppTheme>();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.app.colors.surfaceBase);
  }, [theme.app.colors.surfaceBase]);

  return (
    <>
      <Stack
        screenOptions={{
          animation: 'fade',
          contentStyle: {
            backgroundColor: theme.app.colors.surfaceBase,
          },
          headerShown: false,
        }}
      />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
