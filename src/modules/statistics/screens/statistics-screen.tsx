import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useOnboardingState } from '@modules/onboarding';
import { useSettingsSnapshot } from '@modules/settings';
import type { MeasurementUnit } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';
import {
  AppScreen,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
import { SkeletonCard } from '@shared/motion';

import { InsightList } from '../components/insight-list';
import { MonthlyHeatmap } from '../components/monthly-heatmap';
import { StatCard } from '../components/stat-card';
import { WeeklyBarChart } from '../components/weekly-bar-chart';
import { useStatisticsDashboard } from '../hooks/use-statistics-dashboard';
import type { DailyHydrationTotal, StatisticsDashboardData } from '../types/statistics';
import { formatHour } from '../utils/insights';

export function StatisticsScreen() {
  const { state } = useOnboardingState();
  const settings = useSettingsSnapshot();
  const statistics = useStatisticsDashboard(state.hydrationGoal);

  if (statistics.status === 'loading') {
    return (
      <AppScreen style={styles.stateScreen}>
        <SkeletonCard rows={2} />
        <SkeletonCard rows={4} />
      </AppScreen>
    );
  }

  if (statistics.status === 'error') {
    return (
      <AppScreen style={styles.stateScreen}>
        <SectionHeader
          subtitle="Your hydration logs should remain safely on this device."
          title={statistics.errorMessage ?? "We couldn't load statistics."}
        />
        <PrimaryButton label="Retry" onPress={statistics.retry} />
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => {
            router.back();
          }}
        />
      </AppScreen>
    );
  }

  if (statistics.data === undefined) {
    return null;
  }

  return (
    <StatisticsDashboard
      data={statistics.data}
      goalAmount={state.hydrationGoal}
      measurementUnit={settings.measurementUnit}
    />
  );
}

function StatisticsDashboard({
  data,
  goalAmount,
  measurementUnit,
}: {
  data: StatisticsDashboardData;
  goalAmount: number;
  measurementUnit: MeasurementUnit;
}) {
  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="back"
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
        />
        <SectionHeader
          subtitle="Simple local insights from your hydration history."
          title="Statistics"
        />
        <View style={styles.navigation}>
          <SecondaryButton
            label="Home"
            onPress={() => {
              router.push('/');
            }}
            style={styles.navButton}
          />
          <SecondaryButton
            label="History"
            onPress={() => {
              router.push('/history' as never);
            }}
            style={styles.navButton}
          />
        </View>
      </View>

      <Section title="Today's summary">
        <View style={styles.cardGrid}>
          <StatCard
            label="Current"
            value={formatMeasurementAmount(data.today.totalAmount, measurementUnit)}
          />
          <StatCard label="Goal" value={formatMeasurementAmount(goalAmount, measurementUnit)} />
          <StatCard
            label="Remaining"
            value={formatMeasurementAmount(
              Math.max(goalAmount - data.today.totalAmount, 0),
              measurementUnit,
            )}
          />
          <StatCard label="Complete" value={`${Math.round(data.today.percentComplete * 100)}%`} />
        </View>
      </Section>

      <Section title="Streaks">
        <View style={styles.cardGrid}>
          <StatCard label="Current streak" value={`${data.streaks.currentStreak} days`} />
          <StatCard label="Longest streak" value={`${data.streaks.longestStreak} days`} />
          <StatCard label="Goals reached" value={`${data.daysGoalAchieved} days`} />
        </View>
      </Section>

      <Section title="Weekly overview">
        <WeeklyBarChart
          goalAmount={goalAmount}
          measurementUnit={measurementUnit}
          points={data.weeklyTotals}
        />
      </Section>

      <Section title="Monthly overview">
        <MonthlyHeatmap points={data.monthlyTotals} />
      </Section>

      <Section title="Summary insights">
        <View style={styles.cardGrid}>
          <StatCard
            label="Average intake"
            value={formatMeasurementAmount(data.averageIntake, measurementUnit)}
          />
          <StatCard label="Average complete" value={`${data.averageCompletionPercent}%`} />
          <StatCard label="Best day" value={formatDayValue(data.bestDay, measurementUnit)} />
          <StatCard
            label="Lowest logged day"
            value={formatDayValue(data.worstDay, measurementUnit)}
          />
          <StatCard
            label="Usual hour"
            value={
              data.mostCommonDrinkingHour === undefined
                ? 'More data needed'
                : formatHour(data.mostCommonDrinkingHour)
            }
          />
        </View>
        <InsightList insights={data.insights} />
      </Section>
    </AppScreen>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}

function formatDayValue(
  day: DailyHydrationTotal | undefined,
  measurementUnit: MeasurementUnit,
): string {
  return day === undefined
    ? 'More data needed'
    : formatMeasurementAmount(day.totalAmount, measurementUnit);
}

const styles = StyleSheet.create({
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  header: {
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  navButton: {
    flexBasis: 110,
    flexGrow: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  screen: {
    alignSelf: 'center',
    maxWidth: 720,
    width: '100%',
  },
  section: {
    gap: 14,
  },
  stateScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
