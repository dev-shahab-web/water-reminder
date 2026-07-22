import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

import { motionDuration } from '@shared/motion';
import type { AppTheme } from '@shared/theme';
import type { MeasurementUnit } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';

import type { DailyHydrationPoint } from '../types/statistics';

type WeeklyBarChartProps = {
  goalAmount: number;
  measurementUnit: MeasurementUnit;
  points: readonly DailyHydrationPoint[];
};

export function WeeklyBarChart({ goalAmount, measurementUnit, points }: WeeklyBarChartProps) {
  const theme = useTheme<AppTheme>();
  const maxValue = Math.max(goalAmount, ...points.map((point) => point.totalAmount), 1);

  return (
    <View
      accessibilityLabel={points
        .map(
          (point) =>
            `${point.dateKey}: ${formatMeasurementAmount(point.totalAmount, measurementUnit)}`,
        )
        .join('. ')}
      style={styles.container}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {points.map((point) => {
            const barHeight = Math.max((point.totalAmount / maxValue) * 120, 4);
            const goalPosition = Math.min((goalAmount / maxValue) * 120, 120);

            return (
              <View key={point.dateKey} style={styles.barGroup}>
                <View
                  style={[
                    styles.barTrack,
                    {
                      backgroundColor: theme.app.colors.surfaceSubtle,
                      borderRadius: theme.app.radius.md,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.goalMarker,
                      {
                        backgroundColor: theme.app.colors.hydrationComplete,
                        bottom: goalPosition,
                      },
                    ]}
                  />
                  <AnimatedBar height={barHeight}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: point.goalAchieved
                            ? theme.app.colors.hydrationComplete
                            : theme.app.colors.hydrationProgress,
                          borderRadius: theme.app.radius.md,
                        },
                      ]}
                    />
                  </AnimatedBar>
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: theme.app.colors.textSecondary,
                      fontSize: theme.app.typography.fontSize.caption,
                      lineHeight: theme.app.typography.lineHeight.caption,
                    },
                  ]}
                >
                  {point.dateKey.slice(5)}
                </Text>
                <Text
                  style={[
                    styles.amountLabel,
                    {
                      color: theme.app.colors.textPrimary,
                      fontSize: theme.app.typography.fontSize.caption,
                      lineHeight: theme.app.typography.lineHeight.caption,
                    },
                  ]}
                >
                  {formatMeasurementAmount(point.totalAmount, measurementUnit)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function AnimatedBar({ children, height }: { children: React.ReactNode; height: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduceMotion ? 0 : motionDuration.standard,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(height * progress.value, 4),
  }));

  return <Animated.View style={[styles.bar, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  amountLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
  bar: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
  barFill: {
    flex: 1,
  },
  barGroup: {
    alignItems: 'center',
    gap: 6,
    width: 58,
  },
  barTrack: {
    height: 120,
    overflow: 'hidden',
    width: 34,
  },
  chart: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 4,
  },
  container: {},
  dayLabel: {
    textAlign: 'center',
  },
  goalMarker: {
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
});
