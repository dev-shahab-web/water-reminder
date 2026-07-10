import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_HYDRATION_GOAL_ML,
  MAX_HYDRATION_GOAL_ML,
  MIN_HYDRATION_GOAL_ML,
  clampHydrationGoal,
  goalOptions,
} from './goal-options';

describe('onboarding goal options', () => {
  it('keeps the approved default goal available as a gender-independent recommendation', () => {
    expect(goalOptions.some((option) => option.amountMl === DEFAULT_HYDRATION_GOAL_ML)).toBe(true);
  });

  it('clamps manual goal adjustments to the supported range', () => {
    expect(clampHydrationGoal(MIN_HYDRATION_GOAL_ML - 1)).toBe(MIN_HYDRATION_GOAL_ML);
    expect(clampHydrationGoal(MAX_HYDRATION_GOAL_ML + 1)).toBe(MAX_HYDRATION_GOAL_ML);
    expect(clampHydrationGoal(DEFAULT_HYDRATION_GOAL_ML)).toBe(DEFAULT_HYDRATION_GOAL_ML);
  });
});
