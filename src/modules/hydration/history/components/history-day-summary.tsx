import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { AnimatedCard } from '@shared/motion';
import type { AppTheme } from '@shared/theme';
import type { MeasurementUnit } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';

import type { HydrationSummary } from '../../types';

type HistoryDaySummaryProps = {
  measurementUnit: MeasurementUnit;
  summary: HydrationSummary;
};

export function HistoryDaySummary({ measurementUnit, summary }: HistoryDaySummaryProps) {
  const theme = useTheme<AppTheme>();
  const percentComplete = Math.round(summary.percent * 100);
  const isComplete = summary.totalAmount >= summary.goalAmount;

  return (
    <AnimatedCard
      accessibilityLabel={`${formatMeasurementAmount(
        summary.totalAmount,
        measurementUnit,
      )} logged. Daily goal ${formatMeasurementAmount(
        summary.goalAmount,
        measurementUnit,
      )}. ${percentComplete} percent complete.`}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.lg,
        },
      ]}
    >
      <Metric label="Total" value={formatMeasurementAmount(summary.totalAmount, measurementUnit)} />
      <Metric label="Goal" value={formatMeasurementAmount(summary.goalAmount, measurementUnit)} />
      <Metric
        label={isComplete ? 'Status' : 'Remaining'}
        value={
          isComplete
            ? 'Goal met'
            : formatMeasurementAmount(summary.remainingAmount, measurementUnit)
        }
      />
    </AnimatedCard>
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
