import type {
  DailyHydrationTotal,
  HourlyHydrationTotal,
  StatisticsInsight,
  StreakSummary,
  TrendSummary,
} from '../types/statistics';
import {
  calculateAverageCompletionPercent,
  findMostCommonDrinkingHour,
} from './statistics-calculations';

export const formatHour = (hour: number): string => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
  }).format(date);
};

export const buildStatisticsInsights = ({
  goalAmount,
  hourlyDistribution,
  streaks,
  totals,
  trend,
}: {
  goalAmount: number;
  hourlyDistribution: readonly HourlyHydrationTotal[];
  streaks: StreakSummary;
  totals: readonly DailyHydrationTotal[];
  trend: TrendSummary;
}): StatisticsInsight[] => {
  const insights: StatisticsInsight[] = [];
  const averageCompletion = calculateAverageCompletionPercent({ goalAmount, totals });
  const mostCommonHour = findMostCommonDrinkingHour(hourlyDistribution);

  if (trend.direction === 'improving') {
    insights.push({
      detail: `Your average is up ${trend.changePercent}% compared with the previous week.`,
      title: 'Trending up',
    });
  } else if (trend.direction === 'declining') {
    insights.push({
      detail: 'A quieter week. Your quick-add buttons are ready when you are.',
      title: 'Gentle reset',
    });
  } else if (trend.direction === 'stable') {
    insights.push({
      detail: 'Your weekly rhythm is steady.',
      title: 'Steady rhythm',
    });
  }

  if (mostCommonHour !== undefined && hourlyDistribution.length >= 2) {
    insights.push({
      detail: `You most often log water around ${formatHour(mostCommonHour)}.`,
      title: 'Usual drinking time',
    });
  }

  if (streaks.currentStreak > 0) {
    insights.push({
      detail: `${streaks.currentStreak} completed ${
        streaks.currentStreak === 1 ? 'day' : 'days'
      } in a row.`,
      title: 'Current streak',
    });
  }

  if (averageCompletion >= 80 && totals.length >= 3) {
    insights.push({
      detail: `You average ${averageCompletion}% of your daily goal on logged days.`,
      title: 'Close to goal',
    });
  }

  if (insights.length === 0) {
    insights.push({
      detail: 'Log water over a few days to reveal simple, local insights.',
      title: 'More history needed',
    });
  }

  return insights.slice(0, 4);
};
