import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useTheme } from 'react-native-paper';

import { handleReminderNotificationResponse } from '@modules/reminders';
import type { AppTheme } from '@shared/theme';
import { addNotificationResponseListener } from '@platform/notifications';
import { trackEventSafely, trackScreen } from '@platform/telemetry';
import { useAppDispatch } from '@state/store/hooks';

export function AppShell() {
  const theme = useTheme<AppTheme>();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.app.colors.surfaceBase);
  }, [theme.app.colors.surfaceBase]);

  useEffect(() => {
    const subscription = addNotificationResponseListener((response) => {
      void handleReminderNotificationResponse({ dispatch, response }).then((result) => {
        if (
          result === 'ignored' ||
          result === 'dismissed' ||
          result === 'duplicate' ||
          result === 'snoozed'
        ) {
          return;
        }

        trackEventSafely('notification_clicked', { source: 'notification' });
        router.replace({
          pathname: '/',
          params: {
            reminderPulse: String(Date.now()),
          },
        });
      });
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

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
