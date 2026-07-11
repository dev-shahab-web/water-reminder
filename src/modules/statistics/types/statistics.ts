export type DailyHydrationTotal = {
  dateKey: string;
  entryCount: number;
  totalAmount: number;
};

export type HourlyHydrationTotal = {
  entryCount: number;
  hour: number;
  totalAmount: number;
};

export type DailyHydrationPoint = DailyHydrationTotal & {
  goalAchieved: boolean;
  percentComplete: number;
};

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
};

export type TrendDirection = 'declining' | 'improving' | 'stable' | 'unknown';

export type TrendSummary = {
  changePercent: number;
  direction: TrendDirection;
};

export type StatisticsInsight = {
  detail: string;
  title: string;
};

export type StatisticsDashboardData = {
  averageCompletionPercent: number;
  averageIntake: number;
  bestDay?: DailyHydrationTotal;
  daysGoalAchieved: number;
  hourlyDistribution: HourlyHydrationTotal[];
  insights: StatisticsInsight[];
  monthlyTotals: DailyHydrationPoint[];
  mostCommonDrinkingHour?: number;
  streaks: StreakSummary;
  today: DailyHydrationPoint;
  trend: TrendSummary;
  weeklyTotals: DailyHydrationPoint[];
  worstDay?: DailyHydrationTotal;
};
