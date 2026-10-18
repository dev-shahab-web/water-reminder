import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useTheme } from 'react-native-paper';

import { handleReminderNotificationResponse } from '@modules/reminders';
import { HydrationFeedback } from '@modules/hydration/components/hydration-feedback';
import type { AppTheme } from '@shared/theme';
import {
  addNotificationResponseListener,
  isDefaultNotificationAction,
} from '@platform/notifications';
import { trackEventSafely, trackScreen } from '@platform/telemetry';
import { useAppDispatch } from '@state/store/hooks';
import { useAppReduceMotion } from '@shared/motion/motion-provider';
import { isPremiumNotification } from '@platform/notifications/premium-notification';
import { hasPremiumAccess } from '@modules/premium/services/premium-service';
import { EngagementRuntime } from '@modules/app-engagement/components/engagement-runtime';

export function AppShell() {
  const theme = useTheme<AppTheme>();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const reduceMotion = useAppReduceMotion();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.app.colors.surfaceBase);
  }, [theme.app.colors.surfaceBase]);

  useEffect(() => {
    const subscription = addNotificationResponseListener(async (response) => {
      try {
        if (isPremiumNotification(response.data)) {
          if (isDefaultNotificationAction(response.actionIdentifier))
            router.push(hasPremiumAccess() ? '/premium-settings' : '/paywall');
          return;
        }
        const result = await handleReminderNotificationResponse({ dispatch, response });
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
      } catch (error) {
        Alert.alert(
          'Reminder action failed',
          error instanceof Error ? error.message : 'Please try again.',
        );
        throw error;
      }
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
      <HydrationFeedback />
      <EngagementRuntime />
      <Stack
        screenOptions={{
          animation: reduceMotion ? 'none' : 'slide_from_right',
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
