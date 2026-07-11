import { getLocalDateKey } from '../../hydration/utils/date';

import type {
  DailyHydrationPoint,
  DailyHydrationTotal,
  HourlyHydrationTotal,
  StreakSummary,
  TrendSummary,
} from '../types/statistics';
import { getPreviousDateKey } from './date-ranges';

export const buildDailyPoints = ({
  dates,
  goalAmount,
  totals,
}: {
  dates: readonly Date[];
  goalAmount: number;
  totals: readonly DailyHydrationTotal[];
}): DailyHydrationPoint[] => {
  const totalByDate = new Map(totals.map((total) => [total.dateKey, total]));

  return dates.map((date) => {
    const dateKey = getLocalDateKey(date);
    const total = totalByDate.get(dateKey);
    const totalAmount = total?.totalAmount ?? 0;

    return {
      dateKey,
      entryCount: total?.entryCount ?? 0,
      goalAchieved: totalAmount >= goalAmount,
      percentComplete: goalAmount <= 0 ? 0 : totalAmount / goalAmount,
      totalAmount,
    };
  });
};

export const calculateAverageIntake = (totals: readonly DailyHydrationTotal[]): number => {
  if (totals.length === 0) {
    return 0;
  }

  return Math.round(totals.reduce((sum, total) => sum + total.totalAmount, 0) / totals.length);
};

export const calculateAverageCompletionPercent = ({
  goalAmount,
  totals,
}: {
  goalAmount: number;
  totals: readonly DailyHydrationTotal[];
}): number => {
  if (totals.length === 0 || goalAmount <= 0) {
    return 0;
  }

  const averageCompletion =
    totals.reduce((sum, total) => sum + Math.min(total.totalAmount / goalAmount, 1), 0) /
    totals.length;

  return Math.round(averageCompletion * 100);
};

export const calculateGoalAchievementCount = ({
  goalAmount,
  totals,
}: {
  goalAmount: number;
  totals: readonly DailyHydrationTotal[];
}): number => {
  return totals.filter((total) => total.totalAmount >= goalAmount).length;
};

export const findBestDay = (
  totals: readonly DailyHydrationTotal[],
): DailyHydrationTotal | undefined => {
  return totals.reduce<DailyHydrationTotal | undefined>(
    (bestDay, total) =>
      bestDay === undefined || total.totalAmount > bestDay.totalAmount ? total : bestDay,
    undefined,
  );
};

export const findWorstLoggedDay = (
  totals: readonly DailyHydrationTotal[],
): DailyHydrationTotal | undefined => {
  return totals.reduce<DailyHydrationTotal | undefined>(
    (worstDay, total) =>
      worstDay === undefined || total.totalAmount < worstDay.totalAmount ? total : worstDay,
    undefined,
  );
};

export const calculateStreaks = ({
  goalAmount,
  todayKey = getLocalDateKey(),
  totals,
}: {
  goalAmount: number;
  todayKey?: string;
  totals: readonly DailyHydrationTotal[];
}): StreakSummary => {
  const completedDays = new Set(
    totals.filter((total) => total.totalAmount >= goalAmount).map((total) => total.dateKey),
  );
  let currentStreak = 0;
  let cursor = todayKey;

  while (completedDays.has(cursor)) {
    currentStreak += 1;
    cursor = getPreviousDateKey(cursor);
  }

  const sortedCompletedDays = [...completedDays].sort();
  let longestStreak = 0;
  let activeStreak = 0;
  let previousDateKey: string | undefined;

  sortedCompletedDays.forEach((dateKey) => {
    if (previousDateKey === undefined || getPreviousDateKey(dateKey) === previousDateKey) {
      activeStreak += 1;
    } else {
      activeStreak = 1;
    }

    longestStreak = Math.max(longestStreak, activeStreak);
    previousDateKey = dateKey;
  });

  return {
    currentStreak,
    longestStreak,
  };
};

export const calculateTrend = ({
  currentTotals,
  previousTotals,
}: {
  currentTotals: readonly DailyHydrationTotal[];
  previousTotals: readonly DailyHydrationTotal[];
}): TrendSummary => {
  const currentAverage = calculateAverageIntake(currentTotals);
  const previousAverage = calculateAverageIntake(previousTotals);

  if (currentTotals.length < 3 || previousTotals.length < 3 || previousAverage === 0) {
    return {
      changePercent: 0,
      direction: 'unknown',
    };
  }

  const changePercent = Math.round(((currentAverage - previousAverage) / previousAverage) * 100);

  if (changePercent >= 10) {
    return {
      changePercent,
      direction: 'improving',
    };
  }

  if (changePercent <= -10) {
    return {
      changePercent,
      direction: 'declining',
    };
  }

  return {
    changePercent,
    direction: 'stable',
  };
};

export const findMostCommonDrinkingHour = (
  hourlyTotals: readonly HourlyHydrationTotal[],
): number | undefined => {
  return hourlyTotals[0]?.hour;
};
