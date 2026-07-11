import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';
import { addNotificationResponseListener } from '@platform/notifications';

export function AppShell() {
  const theme = useTheme<AppTheme>();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.app.colors.surfaceBase);
  }, [theme.app.colors.surfaceBase]);

  useEffect(() => {
    const subscription = addNotificationResponseListener(() => {
      router.replace({
        pathname: '/',
        params: {
          reminderPulse: String(Date.now()),
        },
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </>
  );
}
