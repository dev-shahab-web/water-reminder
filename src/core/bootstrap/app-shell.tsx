import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';
import { addNotificationResponseListener } from '@platform/notifications';
import { trackEventSafely, trackScreen } from '@platform/telemetry';

export function AppShell() {
  const theme = useTheme<AppTheme>();
  const pathname = usePathname();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.app.colors.surfaceBase);
  }, [theme.app.colors.surfaceBase]);

  useEffect(() => {
    const subscription = addNotificationResponseListener(() => {
      trackEventSafely('notification_clicked', { source: 'notification' });
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

  useEffect(() => {
    trackScreen(pathname);
  }, [pathname]);

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
