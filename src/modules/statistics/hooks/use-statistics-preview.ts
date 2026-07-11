import { useEffect, useState } from 'react';

import type { StatisticsDashboardData } from '../types/statistics';
import { getStatisticsDashboardData } from '../services/statistics-service';

export type StatisticsPreview = {
  currentStreak: number;
  weeklyAverage: number;
};

export const useStatisticsPreview = (goalAmount: number) => {
  const [preview, setPreview] = useState<StatisticsPreview | undefined>();

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const data: StatisticsDashboardData = await getStatisticsDashboardData({ goalAmount });
      const activeWeeklyDays = data.weeklyTotals.filter((point) => point.totalAmount > 0);
      const weeklyAverage =
        activeWeeklyDays.length === 0
          ? 0
          : Math.round(
              activeWeeklyDays.reduce((sum, point) => sum + point.totalAmount, 0) /
                activeWeeklyDays.length,
            );

      if (isMounted) {
        setPreview({
          currentStreak: data.streaks.currentStreak,
          weeklyAverage,
        });
      }
    };

    load().catch(() => {
      if (isMounted) {
        setPreview(undefined);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [goalAmount]);

  return preview;
};
