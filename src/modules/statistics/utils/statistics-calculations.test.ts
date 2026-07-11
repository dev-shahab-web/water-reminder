import { describe, expect, it } from '@jest/globals';

import type { DailyHydrationTotal, HourlyHydrationTotal } from '../types/statistics';
import { getLastSevenDays, getMonthDates } from './date-ranges';
import {
  buildDailyPoints,
  calculateAverageCompletionPercent,
  calculateAverageIntake,
  calculateGoalAchievementCount,
  calculateStreaks,
  calculateTrend,
  findMostCommonDrinkingHour,
} from './statistics-calculations';

const total = (dateKey: string, totalAmount: number): DailyHydrationTotal => ({
  dateKey,
  entryCount: 2,
  totalAmount,
});

describe('statistics calculations', () => {
  it('builds a seven day series with empty days filled', () => {
    const dates = getLastSevenDays(new Date(2026, 6, 11));
    const points = buildDailyPoints({
      dates,
      goalAmount: 2000,
      totals: [total('2026-07-11', 2000)],
    });

    expect(points).toHaveLength(7);
    expect(points[6]?.goalAchieved).toBe(true);
    expect(points[0]?.totalAmount).toBe(0);
  });

  it('handles leap-year month ranges', () => {
    expect(getMonthDates(new Date(2024, 1, 12))).toHaveLength(29);
  });

  it('calculates current streak only when today is complete', () => {
    expect(
      calculateStreaks({
        goalAmount: 2000,
        todayKey: '2026-07-11',
        totals: [total('2026-07-09', 2200), total('2026-07-10', 2100), total('2026-07-11', 1800)],
      }).currentStreak,
    ).toBe(0);
  });

  it('calculates longest completed streak across broken runs', () => {
    expect(
      calculateStreaks({
        goalAmount: 2000,
        todayKey: '2026-07-11',
        totals: [
          total('2026-07-01', 2100),
          total('2026-07-02', 2200),
          total('2026-07-04', 2300),
          total('2026-07-05', 2400),
          total('2026-07-06', 2500),
        ],
      }).longestStreak,
    ).toBe(3);
  });

  it('calculates averages and goal completion', () => {
    const totals = [total('2026-07-10', 2000), total('2026-07-11', 1000)];

    expect(calculateAverageIntake(totals)).toBe(1500);
    expect(calculateAverageCompletionPercent({ goalAmount: 2000, totals })).toBe(75);
    expect(calculateGoalAchievementCount({ goalAmount: 2000, totals })).toBe(1);
  });

  it('detects hydration trend direction', () => {
    expect(
      calculateTrend({
        currentTotals: [
          total('2026-07-09', 2000),
          total('2026-07-10', 2200),
          total('2026-07-11', 2400),
        ],
        previousTotals: [
          total('2026-07-02', 1000),
          total('2026-07-03', 1100),
          total('2026-07-04', 1200),
        ],
      }).direction,
    ).toBe('improving');
  });

  it('uses aggregated hourly distribution for the common drinking hour', () => {
    const hourlyTotals: HourlyHydrationTotal[] = [
      { entryCount: 4, hour: 17, totalAmount: 1000 },
      { entryCount: 2, hour: 8, totalAmount: 1200 },
    ];

    expect(findMostCommonDrinkingHour(hourlyTotals)).toBe(17);
  });
});
