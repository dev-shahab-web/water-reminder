import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

import type { DailyHydrationPoint } from '../types/statistics';

type MonthlyHeatmapProps = {
  points: readonly DailyHydrationPoint[];
};

export function MonthlyHeatmap({ points }: MonthlyHeatmapProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View
      accessibilityLabel={points
        .map((point) => `${point.dateKey}: ${Math.round(point.percentComplete * 100)} percent`)
        .join('. ')}
      style={styles.grid}
    >
      {points.map((point) => {
        const intensity = Math.min(point.percentComplete, 1);

        return (
          <View
            key={point.dateKey}
            style={[
              styles.cell,
              {
                backgroundColor:
                  point.totalAmount === 0
                    ? theme.app.colors.surfaceSubtle
                    : point.goalAchieved
                      ? theme.app.colors.hydrationComplete
                      : theme.app.colors.hydrationProgress,
                borderColor: point.goalAchieved
                  ? theme.app.colors.hydrationComplete
                  : theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.sm,
                opacity: point.totalAmount === 0 ? 1 : 0.32 + intensity * 0.68,
              },
            ]}
          >
            <Text
              style={[
                styles.day,
                {
                  color: point.goalAchieved ? theme.colors.onPrimary : theme.app.colors.textPrimary,
                  fontSize: theme.app.typography.fontSize.caption,
                  lineHeight: theme.app.typography.lineHeight.caption,
                },
              ]}
            >
              {Number(point.dateKey.slice(-2))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  day: {
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
