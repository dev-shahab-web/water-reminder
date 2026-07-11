import { memo, useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type SkeletonCardProps = {
  rows?: number;
  style?: ViewStyle;
};

export const SkeletonCard = memo(function SkeletonCard({ rows = 3, style }: SkeletonCardProps) {
  const theme = useTheme<AppTheme>();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0;
      return;
    }

    progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.72 : interpolate(progress.value, [0, 1], [0.48, 0.82]),
  }));

  return (
    <Animated.View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.lg,
        },
        style,
        animatedStyle,
      ]}
    >
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            {
              backgroundColor: theme.app.colors.surfaceSubtle,
              borderRadius: theme.app.radius.sm,
              width: `${index === rows - 1 ? 58 : 100}%`,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  row: {
    height: 18,
  },
});
