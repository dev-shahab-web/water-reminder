import { getOnboardingState } from '@modules/onboarding';
import { getReminderPreferences } from '@modules/reminders/repository/reminder-preferences-storage';
import { calculateReminderSchedule } from '@modules/reminders/utils/scheduler';
import { getSettingsState } from '@modules/settings/storage/settings-storage';
import { getStatisticsDashboardData } from '@modules/statistics/services/statistics-service';
import { getTodayHydrationEntries } from '@modules/hydration/repository/hydration-repository';
import { calculateHydrationSummary } from '@modules/hydration/utils/summary';

import type { HydrationWidgetState } from '../types';
import { clampCompletionPercentage, getRemainingMl } from '../utils/widget-format';

const createActionNonce = (): string => {
  return `widget_action_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const buildHydrationWidgetState = async (
  now = new Date(),
): Promise<HydrationWidgetState> => {
  const onboardingState = getOnboardingState();
  const settings = getSettingsState();
  const entries = await getTodayHydrationEntries(now);
  const summary = calculateHydrationSummary(entries, onboardingState.hydrationGoal);
  const reminderPreferences = getReminderPreferences();
  const reminderSchedule = calculateReminderSchedule({
    goalAmount: summary.goalAmount,
    now,
    preferences: reminderPreferences,
    totalAmount: summary.totalAmount,
  });
  const statistics = await getStatisticsDashboardData({
    goalAmount: summary.goalAmount,
    today: now,
  });
  const completionPercentage = clampCompletionPercentage({
    consumedMl: summary.totalAmount,
    goalMl: summary.goalAmount,
  });

  return {
    actionNonce: createActionNonce(),
    completionPercentage,
    consumedMl: summary.totalAmount,
    currentStreak: statistics.streaks.currentStreak,
    goalCompleted: summary.totalAmount >= summary.goalAmount,
    goalMl: summary.goalAmount,
    measurementUnit: settings.measurementUnit,
    nextReminderAt: reminderSchedule[0]?.date.getTime() ?? null,
    onboardingCompleted: onboardingState.onboardingCompleted,
    remainingMl: getRemainingMl({
      consumedMl: summary.totalAmount,
      goalMl: summary.goalAmount,
    }),
    themePreference: settings.themePreference,
    updatedAt: now.getTime(),
  };
};
