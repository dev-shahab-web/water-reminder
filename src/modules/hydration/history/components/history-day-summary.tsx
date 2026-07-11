import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

import type { HydrationSummary } from '../../types';

type HistoryDaySummaryProps = {
  summary: HydrationSummary;
};

export function HistoryDaySummary({ summary }: HistoryDaySummaryProps) {
  const theme = useTheme<AppTheme>();
  const percentComplete = Math.round(summary.percent * 100);
  const isComplete = summary.totalAmount >= summary.goalAmount;

  return (
    <View
      accessibilityLabel={`${summary.totalAmount} milliliters logged. Daily goal ${summary.goalAmount} milliliters. ${percentComplete} percent complete.`}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.lg,
        },
      ]}
    >
      <Metric label="Total" value={`${summary.totalAmount} ml`} />
      <Metric label="Goal" value={`${summary.goalAmount} ml`} />
      <Metric
        label={isComplete ? 'Status' : 'Remaining'}
        value={isComplete ? 'Goal met' : `${summary.remainingAmount} ml`}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.metric}>
      <Text
        style={[
          styles.label,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.subtitle,
            lineHeight: theme.app.typography.lineHeight.subtitle,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  label: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metric: {
    flexBasis: 130,
    flexGrow: 1,
    gap: 4,
  },
  value: {
    fontWeight: '800',
  },
});
