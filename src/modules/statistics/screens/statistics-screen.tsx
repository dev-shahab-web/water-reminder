import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { useOnboardingState } from '@modules/onboarding';
import { AppScreen, PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import { InsightList } from '../components/insight-list';
import { MonthlyHeatmap } from '../components/monthly-heatmap';
import { StatCard } from '../components/stat-card';
import { WeeklyBarChart } from '../components/weekly-bar-chart';
import { useStatisticsDashboard } from '../hooks/use-statistics-dashboard';
import type { DailyHydrationTotal, StatisticsDashboardData } from '../types/statistics';
import { formatHour } from '../utils/insights';

export function StatisticsScreen() {
  const theme = useTheme<AppTheme>();
  const { state } = useOnboardingState();
  const statistics = useStatisticsDashboard(state.hydrationGoal);

  if (statistics.status === 'loading') {
    return (
      <AppScreen style={styles.stateScreen}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text
          style={[
            styles.stateText,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.body,
              lineHeight: theme.app.typography.lineHeight.body,
            },
          ]}
        >
          Loading statistics.
        </Text>
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
        <SecondaryButton
          label="Home"
          onPress={() => {
            router.push('/');
          }}
        />
      </AppScreen>
    );
  }

  if (statistics.data === undefined) {
    return null;
  }

  return <StatisticsDashboard data={statistics.data} goalAmount={state.hydrationGoal} />;
}

function StatisticsDashboard({
  data,
  goalAmount,
}: {
  data: StatisticsDashboardData;
  goalAmount: number;
}) {
  return (
    <AppScreen scrollable style={styles.screen}>
      <View style={styles.header}>
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
          <StatCard label="Current" value={`${data.today.totalAmount} ml`} />
          <StatCard label="Goal" value={`${goalAmount} ml`} />
          <StatCard
            label="Remaining"
            value={`${Math.max(goalAmount - data.today.totalAmount, 0)} ml`}
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
        <WeeklyBarChart goalAmount={goalAmount} points={data.weeklyTotals} />
      </Section>

      <Section title="Monthly overview">
        <MonthlyHeatmap points={data.monthlyTotals} />
      </Section>

      <Section title="Summary insights">
        <View style={styles.cardGrid}>
          <StatCard label="Average intake" value={`${data.averageIntake} ml`} />
          <StatCard label="Average complete" value={`${data.averageCompletionPercent}%`} />
          <StatCard label="Best day" value={formatDayValue(data.bestDay)} />
          <StatCard label="Lowest logged day" value={formatDayValue(data.worstDay)} />
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

function formatDayValue(day: DailyHydrationTotal | undefined): string {
  return day === undefined ? 'More data needed' : `${day.totalAmount} ml`;
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
  stateText: {
    textAlign: 'center',
  },
});
