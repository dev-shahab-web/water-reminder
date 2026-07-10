import { getStorage } from '@platform/storage';

import { DEFAULT_HYDRATION_GOAL_ML, clampHydrationGoal } from '../utils/goal-options';
import type { OnboardingState, ReminderPreference } from '../types';

export const onboardingStorageKeys = {
  hydrationGoal: 'hydrationGoal',
  onboardingCompleted: 'onboardingCompleted',
  reminderPreference: 'reminderPreference',
} as const;

const DEFAULT_REMINDER_PREFERENCE: ReminderPreference = 'manual';

export const defaultOnboardingState: OnboardingState = {
  hydrationGoal: DEFAULT_HYDRATION_GOAL_ML,
  onboardingCompleted: false,
  reminderPreference: DEFAULT_REMINDER_PREFERENCE,
};

const isReminderPreference = (value: string | undefined): value is ReminderPreference => {
  return value === 'manual' || value === 'enabled' || value === 'denied';
};

export const getOnboardingState = (): OnboardingState => {
  const storage = getStorage();
  const storedGoal = storage.getNumber(onboardingStorageKeys.hydrationGoal);
  const storedReminderPreference = storage.getString(onboardingStorageKeys.reminderPreference);

  return {
    hydrationGoal:
      storedGoal === undefined
        ? defaultOnboardingState.hydrationGoal
        : clampHydrationGoal(storedGoal),
    onboardingCompleted:
      storage.getBoolean(onboardingStorageKeys.onboardingCompleted) ??
      defaultOnboardingState.onboardingCompleted,
    reminderPreference: isReminderPreference(storedReminderPreference)
      ? storedReminderPreference
      : defaultOnboardingState.reminderPreference,
  };
};

export const completeOnboarding = ({
  hydrationGoal,
  reminderPreference,
}: Pick<OnboardingState, 'hydrationGoal' | 'reminderPreference'>): OnboardingState => {
  const storage = getStorage();
  const nextState: OnboardingState = {
    hydrationGoal: clampHydrationGoal(hydrationGoal),
    onboardingCompleted: true,
    reminderPreference,
  };

  storage.set(onboardingStorageKeys.hydrationGoal, nextState.hydrationGoal);
  storage.set(onboardingStorageKeys.reminderPreference, nextState.reminderPreference);
  storage.set(onboardingStorageKeys.onboardingCompleted, nextState.onboardingCompleted);

  return nextState;
};
