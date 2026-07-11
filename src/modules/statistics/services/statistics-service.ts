import {
  getAllDailyHydrationTotals,
  getDailyHydrationTotalsBetween,
  getHourlyHydrationDistributionBetween,
} from '../repository/statistics-repository';
import type { StatisticsDashboardData } from '../types/statistics';
import {
  getDateKeyRange,
  getLastSevenDays,
  getMonthDates,
  getPreviousSevenDays,
} from '../utils/date-ranges';
import { buildStatisticsInsights } from '../utils/insights';
import {
  buildDailyPoints,
  calculateAverageCompletionPercent,
  calculateAverageIntake,
  calculateGoalAchievementCount,
  calculateStreaks,
  calculateTrend,
  findBestDay,
  findMostCommonDrinkingHour,
  findWorstLoggedDay,
} from '../utils/statistics-calculations';

export const getStatisticsDashboardData = async ({
  goalAmount,
  today = new Date(),
}: {
  goalAmount: number;
  today?: Date;
}): Promise<StatisticsDashboardData> => {
  const weekDates = getLastSevenDays(today);
  const previousWeekDates = getPreviousSevenDays(today);
  const monthDates = getMonthDates(today);
  const weekRange = getDateKeyRange(weekDates);
  const previousWeekRange = getDateKeyRange(previousWeekDates);
  const monthRange = getDateKeyRange(monthDates);
  const [weeklyTotals, previousWeeklyTotals, monthlyTotals, allDailyTotals, hourlyDistribution] =
    await Promise.all([
      getDailyHydrationTotalsBetween(weekRange),
      getDailyHydrationTotalsBetween(previousWeekRange),
      getDailyHydrationTotalsBetween(monthRange),
      getAllDailyHydrationTotals(),
      getHourlyHydrationDistributionBetween(monthRange),
    ]);
  const weeklyPoints = buildDailyPoints({
    dates: weekDates,
    goalAmount,
    totals: weeklyTotals,
  });
  const monthlyPoints = buildDailyPoints({
    dates: monthDates,
    goalAmount,
    totals: monthlyTotals,
  });
  const todayPoint = weeklyPoints[weeklyPoints.length - 1] ?? {
    dateKey: '',
    entryCount: 0,
    goalAchieved: false,
    percentComplete: 0,
    totalAmount: 0,
  };
  const streaks = calculateStreaks({
    goalAmount,
    totals: allDailyTotals,
  });
  const trend = calculateTrend({
    currentTotals: weeklyTotals,
    previousTotals: previousWeeklyTotals,
  });
  const averageIntake = calculateAverageIntake(allDailyTotals);
  const averageCompletionPercent = calculateAverageCompletionPercent({
    goalAmount,
    totals: allDailyTotals,
  });

  return {
    averageCompletionPercent,
    averageIntake,
    bestDay: findBestDay(allDailyTotals),
    daysGoalAchieved: calculateGoalAchievementCount({
      goalAmount,
      totals: allDailyTotals,
    }),
    hourlyDistribution,
    insights: buildStatisticsInsights({
      goalAmount,
      hourlyDistribution,
      streaks,
      totals: allDailyTotals,
      trend,
    }),
    monthlyTotals: monthlyPoints,
    mostCommonDrinkingHour: findMostCommonDrinkingHour(hourlyDistribution),
    streaks,
    today: todayPoint,
    trend,
    weeklyTotals: weeklyPoints,
    worstDay: findWorstLoggedDay(allDailyTotals),
  };
};
