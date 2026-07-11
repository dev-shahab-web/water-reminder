import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

import { AnimatedCounter, motionDuration } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

type HydrationRingProps = {
  attentionKey?: string;
  goalAmount: number;
  message: string;
  remainingAmount: number;
  totalAmount: number;
};

const RING_SIZE = 260;
const SEGMENT_COUNT = 48;
const SEGMENT_INDEXES = Array.from({ length: SEGMENT_COUNT }, (_, index) => index);

export const HydrationRing = memo(function HydrationRing({
  attentionKey,
  goalAmount,
  message,
  remainingAmount,
  totalAmount,
}: HydrationRingProps) {
  const theme = useTheme<AppTheme>();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(Math.min(totalAmount / goalAmount, 1));
  const ripple = useSharedValue(0);
  const completionGlow = useSharedValue(totalAmount >= goalAmount ? 1 : 0);
  const previousAmount = useRef(totalAmount);
  const previousAttentionKey = useRef(attentionKey);

  const cappedProgress = Math.min(totalAmount / goalAmount, 1);
  const isComplete = totalAmount >= goalAmount;

  useEffect(() => {
    const duration = reduceMotion ? 0 : motionDuration.standard;
    progress.value = withTiming(cappedProgress, {
      duration,
      easing: Easing.out(Easing.cubic),
    });

    if (totalAmount !== previousAmount.current) {
      ripple.value = 0;
      ripple.value = withTiming(1, {
        duration: reduceMotion ? 0 : 300,
        easing: Easing.out(Easing.cubic),
      });
    }

    if (attentionKey !== undefined && attentionKey !== previousAttentionKey.current) {
      ripple.value = 0;
      ripple.value = withTiming(1, {
        duration: reduceMotion ? 0 : 300,
        easing: Easing.out(Easing.cubic),
      });
    }

    completionGlow.value = withTiming(isComplete ? 1 : 0, {
      duration: reduceMotion ? 0 : motionDuration.slow,
      easing: Easing.out(Easing.cubic),
    });

    previousAmount.current = totalAmount;
    previousAttentionKey.current = attentionKey;
  }, [
    attentionKey,
    cappedProgress,
    completionGlow,
    goalAmount,
    isComplete,
    progress,
    reduceMotion,
    ripple,
    totalAmount,
  ]);

  const waterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * (RING_SIZE - 36) }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : 0.34 * (1 - ripple.value),
    transform: [{ scale: 0.64 + ripple.value * 0.66 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? completionGlow.value * 0.22 : completionGlow.value * 0.36,
  }));

  return (
    <Animated.View
      accessibilityLabel={`${totalAmount} milliliters logged. ${
        isComplete ? 'Daily goal complete.' : `${remainingAmount} milliliters remaining.`
      } Daily goal ${goalAmount} milliliters.`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        max: goalAmount,
        min: 0,
        now: Math.min(totalAmount, goalAmount),
        text: `${Math.round((totalAmount / goalAmount) * 100)} percent of daily goal`,
      }}
      style={[
        styles.container,
        {
          height: RING_SIZE,
          width: RING_SIZE,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.completeGlow,
          {
            backgroundColor: theme.app.colors.hydrationComplete,
            borderRadius: RING_SIZE / 2,
            height: RING_SIZE,
            width: RING_SIZE,
          },
          glowStyle,
        ]}
      />
      <View
        style={[
          styles.glass,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: RING_SIZE / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.water,
            {
              backgroundColor: theme.colors.primaryContainer,
            },
            waterStyle,
          ]}
        >
          <View
            style={[
              styles.waterSurface,
              {
                backgroundColor: theme.app.colors.hydrationProgress,
              },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.ripple,
            {
              borderColor: theme.app.colors.hydrationProgress,
              borderRadius: RING_SIZE / 2,
            },
            rippleStyle,
          ]}
        />
        <View style={styles.centerCopy}>
          <AnimatedAmount amount={totalAmount} />
          <Text
            style={[
              styles.unit,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.body,
                lineHeight: theme.app.typography.lineHeight.body,
              },
            ]}
          >
            ml today
          </Text>
          <Text
            style={[
              styles.message,
              {
                color: isComplete
                  ? theme.app.colors.hydrationComplete
                  : theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.label,
                lineHeight: theme.app.typography.lineHeight.label,
              },
            ]}
          >
            {message}
          </Text>
        </View>
      </View>

      {SEGMENT_INDEXES.map((index) => (
        <ProgressSegment
          key={index}
          index={index}
          progress={progress}
          segmentCount={SEGMENT_COUNT}
          size={RING_SIZE}
        />
      ))}
    </Animated.View>
  );
});

type AnimatedAmountProps = {
  amount: number;
};

function AnimatedAmount({ amount }: AnimatedAmountProps) {
  const theme = useTheme<AppTheme>();

  return (
    <AnimatedCounter
      value={amount}
      style={[
        styles.amount,
        {
          color: theme.app.colors.textPrimary,
          fontFamily: theme.app.typography.fontFamily.display,
          fontSize: theme.app.typography.fontSize.display,
          lineHeight: theme.app.typography.lineHeight.display,
        },
      ]}
    />
  );
}

type ProgressSegmentProps = {
  index: number;
  progress: SharedValue<number>;
  segmentCount: number;
  size: number;
};

function ProgressSegment({ index, progress, segmentCount, size }: ProgressSegmentProps) {
  const theme = useTheme<AppTheme>();
  const angle = (index / segmentCount) * Math.PI * 2 - Math.PI / 2;
  const radius = size / 2 - 5;
  const left = size / 2 + Math.cos(angle) * radius - 2;
  const top = size / 2 + Math.sin(angle) * radius - 7;

  const animatedStyle = useAnimatedStyle(() => {
    const segmentThreshold = (index + 1) / segmentCount;
    const isActive = progress.value >= segmentThreshold ? 1 : 0;

    return {
      backgroundColor: interpolateColor(
        isActive,
        [0, 1],
        [theme.app.colors.borderSubtle, theme.app.colors.hydrationProgress],
      ),
    };
  });

  return (
    <Animated.View
      style={[
        styles.segment,
        {
          borderRadius: 999,
          left,
          top,
          transform: [{ rotate: `${angle + Math.PI / 2}rad` }],
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  amount: {
    fontWeight: '800',
    textAlign: 'center',
  },
  centerCopy: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 28,
  },
  completeGlow: {
    position: 'absolute',
  },
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  glass: {
    alignItems: 'center',
    borderWidth: 1,
    height: RING_SIZE - 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: RING_SIZE - 36,
  },
  message: {
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  ripple: {
    borderWidth: 2,
    height: RING_SIZE - 84,
    position: 'absolute',
    width: RING_SIZE - 84,
  },
  segment: {
    height: 14,
    position: 'absolute',
    width: 4,
  },
  unit: {
    textAlign: 'center',
  },
  water: {
    bottom: 0,
    height: '100%',
    opacity: 0.76,
    position: 'absolute',
    width: '100%',
  },
  waterSurface: {
    height: 2,
    opacity: 0.44,
    width: '100%',
  },
});
