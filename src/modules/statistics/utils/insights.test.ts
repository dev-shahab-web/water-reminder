import { describe, expect, it } from '@jest/globals';

import { buildStatisticsInsights } from './insights';

describe('statistics insights', () => {
  it('only generates explainable insights from supplied data', () => {
    const insights = buildStatisticsInsights({
      goalAmount: 2000,
      hourlyDistribution: [{ entryCount: 3, hour: 19, totalAmount: 900 }],
      streaks: { currentStreak: 2, longestStreak: 4 },
      totals: [
        { dateKey: '2026-07-09', entryCount: 2, totalAmount: 2000 },
        { dateKey: '2026-07-10', entryCount: 2, totalAmount: 2100 },
        { dateKey: '2026-07-11', entryCount: 2, totalAmount: 2200 },
      ],
      trend: { changePercent: 18, direction: 'improving' },
    });

    expect(insights.some((insight) => insight.title === 'Trending up')).toBe(true);
    expect(insights.some((insight) => insight.title === 'Current streak')).toBe(true);
  });

  it('falls back when there is not enough data', () => {
    expect(
      buildStatisticsInsights({
        goalAmount: 2000,
        hourlyDistribution: [],
        streaks: { currentStreak: 0, longestStreak: 0 },
        totals: [],
        trend: { changePercent: 0, direction: 'unknown' },
      }),
    ).toEqual([
      {
        detail: 'Log water over a few days to reveal simple, local insights.',
        title: 'More history needed',
      },
    ]);
  });
});
