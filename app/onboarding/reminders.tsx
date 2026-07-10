import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import {
  DEFAULT_HYDRATION_GOAL_ML,
  clampHydrationGoal,
  useOnboardingState,
} from '@modules/onboarding';
import { requestNotificationPermissions } from '@platform/notifications';
import { OnboardingPage, PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

export default function ReminderPermissionScreen() {
  const theme = useTheme<AppTheme>();
  const params = useLocalSearchParams<{ hydrationGoal?: string }>();
  const { complete, state } = useOnboardingState();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string | undefined>();

  useEffect(() => {
    if (state.onboardingCompleted) {
      router.replace('/');
    }
  }, [state.onboardingCompleted]);

  const hydrationGoal = useMemo(() => {
    const parsedGoal = Number(params.hydrationGoal);

    return Number.isFinite(parsedGoal) ? clampHydrationGoal(parsedGoal) : DEFAULT_HYDRATION_GOAL_ML;
  }, [params.hydrationGoal]);

  const finishOnboarding = (reminderPreference: 'manual' | 'enabled' | 'denied') => {
    complete({
      hydrationGoal,
      reminderPreference,
    });
    router.replace('/');
  };

  const handleEnableReminders = async () => {
    setIsRequestingPermission(true);
    setPermissionMessage(undefined);

    try {
      const permissions = await requestNotificationPermissions();

      if (permissions.granted) {
        finishOnboarding('enabled');
        return;
      }

      setPermissionMessage('No problem. Water tracking still works without notifications.');
      finishOnboarding('denied');
    } catch {
      setPermissionMessage(
        'Notifications are unavailable right now. You can keep tracking manually.',
      );
      finishOnboarding('manual');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <OnboardingPage
      actions={
        <>
          <PrimaryButton
            accessibilityLabel="Enable gentle reminder notifications"
            disabled={isRequestingPermission}
            label={isRequestingPermission ? 'Opening permission...' : 'Enable reminders'}
            onPress={handleEnableReminders}
          />
          <SecondaryButton
            accessibilityLabel="Skip reminder notifications for now"
            disabled={isRequestingPermission}
            label="Not now"
            onPress={() => {
              finishOnboarding('manual');
            }}
          />
        </>
      }
      currentStep={3}
      totalSteps={3}
    >
      <SectionHeader
        eyebrow="Reminders"
        subtitle="You can pause or turn them off anytime."
        title="Get gentle reminders during the hours you choose."
      />

      <View
        style={[
          styles.summary,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.summaryLabel,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.label,
              lineHeight: theme.app.typography.lineHeight.label,
            },
          ]}
        >
          Selected goal
        </Text>
        <Text
          style={[
            styles.summaryValue,
            {
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.title,
              lineHeight: theme.app.typography.lineHeight.title,
            },
          ]}
        >
          {hydrationGoal} ml per day
        </Text>
      </View>

      <Text
        style={[
          styles.privacyNote,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        Your hydration tracking works without notifications.
      </Text>

      {permissionMessage === undefined ? null : (
        <Text
          accessibilityRole="alert"
          style={[
            styles.permissionMessage,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {permissionMessage}
        </Text>
      )}
    </OnboardingPage>
  );
}

const styles = StyleSheet.create({
  permissionMessage: {
    textAlign: 'center',
  },
  privacyNote: {
    textAlign: 'center',
  },
  summary: {
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  summaryLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontWeight: '800',
  },
});
