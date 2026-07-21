import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { DEFAULT_HYDRATION_GOAL_ML, useOnboardingState } from '@modules/onboarding';
import {
  disableReminders,
  loadReminderPreferences,
} from '@modules/reminders/services/reminder-engine';
import {
  BrandMark,
  ChoiceCard,
  OnboardingPage,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
import type { AppTheme } from '@shared/theme';

const benefits = [
  {
    description: 'Log quickly and return to your day.',
    label: 'Fast tracking',
  },
  {
    description: 'Use reminders only when they help.',
    label: 'Gentle support',
  },
  {
    description: 'Your habit works offline and stays on your device.',
    label: 'Private by default',
  },
] as const;

export default function OnboardingWelcomeScreen() {
  const theme = useTheme<AppTheme>();
  const { complete, state } = useOnboardingState();

  useEffect(() => {
    if (state.onboardingCompleted) {
      router.replace('/');
    }
  }, [state.onboardingCompleted]);

  const handleUseDefaults = async () => {
    await disableReminders(loadReminderPreferences());
    complete({
      hydrationGoal: DEFAULT_HYDRATION_GOAL_ML,
      reminderPreference: 'manual',
    });
    router.replace('/');
  };

  return (
    <OnboardingPage
      actions={
        <>
          <PrimaryButton
            accessibilityLabel="Set up my hydration goal"
            label="Set up my goal"
            onPress={() => {
              router.push('/onboarding/goal');
            }}
          />
          <SecondaryButton
            accessibilityLabel="Use default hydration settings"
            label="Use defaults"
            onPress={() => {
              void handleUseDefaults();
            }}
          />
        </>
      }
      currentStep={1}
      totalSteps={3}
    >
      <View style={styles.hero}>
        <BrandMark size={136} />
        <SectionHeader
          eyebrow="Welcome"
          subtitle="Track water quickly and get gentle reminders when you want them."
          title="Let's build a hydration habit."
        />
      </View>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <ChoiceCard
            key={benefit.label}
            accessibilityLabel={`${benefit.label}. ${benefit.description}`}
            description={benefit.description}
            label={benefit.label}
          />
        ))}
      </View>

      <Text
        style={[
          styles.note,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        No account needed. You can adjust everything later.
      </Text>
    </OnboardingPage>
  );
}

const styles = StyleSheet.create({
  benefits: {
    gap: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 24,
  },
  note: {
    textAlign: 'center',
  },
});
