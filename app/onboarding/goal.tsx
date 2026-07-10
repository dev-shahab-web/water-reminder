import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  DEFAULT_HYDRATION_GOAL_ML,
  HYDRATION_GOAL_STEP_ML,
  MAX_HYDRATION_GOAL_ML,
  MIN_HYDRATION_GOAL_ML,
  clampHydrationGoal,
  goalOptions,
  useOnboardingState,
} from '@modules/onboarding';
import {
  ChoiceCard,
  GoalCard,
  OnboardingPage,
  PrimaryButton,
  SectionHeader,
} from '@shared/components';

export default function GoalSetupScreen() {
  const { state } = useOnboardingState();
  const [goalAmountMl, setGoalAmountMl] = useState(DEFAULT_HYDRATION_GOAL_ML);

  useEffect(() => {
    if (state.onboardingCompleted) {
      router.replace('/');
    }
  }, [state.onboardingCompleted]);

  const handleGoalChange = (amountMl: number) => {
    setGoalAmountMl(clampHydrationGoal(amountMl));
  };

  return (
    <OnboardingPage
      actions={
        <PrimaryButton
          accessibilityLabel="Continue to reminder setup"
          label="Continue"
          onPress={() => {
            router.push({
              pathname: '/onboarding/reminders',
              params: {
                hydrationGoal: String(goalAmountMl),
              },
            });
          }}
        />
      }
      currentStep={2}
      totalSteps={3}
    >
      <SectionHeader
        eyebrow="Daily goal"
        subtitle="Choose a starting point. This is not medical advice, and you can change it anytime."
        title="How much water feels right?"
      />

      <View style={styles.options}>
        {goalOptions.map((option) => (
          <ChoiceCard
            key={option.id}
            accessibilityLabel={`${option.label}, ${option.amountMl} milliliters per day. ${option.description}`}
            description={option.description}
            label={option.label}
            onPress={() => {
              handleGoalChange(option.amountMl);
            }}
            selected={goalAmountMl === option.amountMl}
            value={`${option.amountMl} ml`}
          />
        ))}
      </View>

      <GoalCard
        amountMl={goalAmountMl}
        canDecrease={goalAmountMl > MIN_HYDRATION_GOAL_ML}
        canIncrease={goalAmountMl < MAX_HYDRATION_GOAL_ML}
        onDecrease={() => {
          handleGoalChange(goalAmountMl - HYDRATION_GOAL_STEP_ML);
        }}
        onIncrease={() => {
          handleGoalChange(goalAmountMl + HYDRATION_GOAL_STEP_ML);
        }}
      />
    </OnboardingPage>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 12,
  },
});
