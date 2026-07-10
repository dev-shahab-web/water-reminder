export {
  completeOnboarding,
  defaultOnboardingState,
  getOnboardingState,
  onboardingStorageKeys,
} from './repository/onboarding-storage';
export { useOnboardingState } from './hooks/use-onboarding-state';
export type { OnboardingState, ReminderPreference } from './types';
export {
  DEFAULT_HYDRATION_GOAL_ML,
  HYDRATION_GOAL_STEP_ML,
  MAX_HYDRATION_GOAL_ML,
  MIN_HYDRATION_GOAL_ML,
  clampHydrationGoal,
  goalOptions,
} from './utils/goal-options';
