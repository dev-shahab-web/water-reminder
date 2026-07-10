export const REMINDER_PREFERENCES = ['manual', 'enabled', 'denied'] as const;

export type ReminderPreference = (typeof REMINDER_PREFERENCES)[number];

export type OnboardingState = {
  hydrationGoal: number;
  onboardingCompleted: boolean;
  reminderPreference: ReminderPreference;
};

export type GoalOption = {
  amountMl: number;
  description: string;
  id: string;
  label: string;
};
