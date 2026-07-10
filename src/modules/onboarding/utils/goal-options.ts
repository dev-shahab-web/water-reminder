import type { GoalOption } from '../types';

export const DEFAULT_HYDRATION_GOAL_ML = 2000;
export const MIN_HYDRATION_GOAL_ML = 500;
export const MAX_HYDRATION_GOAL_ML = 5000;
export const HYDRATION_GOAL_STEP_ML = 250;

export const goalOptions: readonly GoalOption[] = [
  {
    amountMl: 1500,
    description: 'A light, approachable start.',
    id: 'light',
    label: 'Light',
  },
  {
    amountMl: DEFAULT_HYDRATION_GOAL_ML,
    description: 'A balanced default for everyday tracking.',
    id: 'standard',
    label: 'Standard',
  },
  {
    amountMl: 2500,
    description: 'A higher target for active days.',
    id: 'active',
    label: 'Active',
  },
] as const;

export const clampHydrationGoal = (amountMl: number): number => {
  return Math.min(MAX_HYDRATION_GOAL_ML, Math.max(MIN_HYDRATION_GOAL_ML, amountMl));
};
