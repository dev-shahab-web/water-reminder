import { useCallback, useMemo, useState } from 'react';

import { completeOnboarding, getOnboardingState } from '../repository/onboarding-storage';
import type { OnboardingState, ReminderPreference } from '../types';

type CompleteOnboardingInput = {
  hydrationGoal: number;
  reminderPreference: ReminderPreference;
};

export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingState>(() => getOnboardingState());

  const refresh = useCallback(() => {
    setState(getOnboardingState());
  }, []);

  const complete = useCallback((input: CompleteOnboardingInput) => {
    const nextState = completeOnboarding(input);
    setState(nextState);

    return nextState;
  }, []);

  return useMemo(
    () => ({
      complete,
      refresh,
      state,
    }),
    [complete, refresh, state],
  );
};
