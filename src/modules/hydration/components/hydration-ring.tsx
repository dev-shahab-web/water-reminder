import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

import { AnimatedCounter, motionDuration } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

type HydrationRingProps = {
  attentionKey?: string;
  continuousMotionEnabled?: boolean;
  goalAmount: number;
  message: string;
  remainingAmount: number;
  reduceMotion?: boolean;
  totalAmount: number;
};

const RING_SIZE = 260;
const GLASS_SIZE = RING_SIZE - 36;
const SEGMENT_COUNT = 48;
const SEGMENT_INDEXES = Array.from({ length: SEGMENT_COUNT }, (_, index) => index);
const WAVE_LOBE_INDEXES = Array.from({ length: 7 }, (_, index) => index);

export const HydrationRing = memo(function HydrationRing({
  attentionKey,
  continuousMotionEnabled = true,
  goalAmount,
  message,
  remainingAmount,
  reduceMotion = false,
  totalAmount,
}: HydrationRingProps) {
  const theme = useTheme<AppTheme>();
  const progress = useSharedValue(Math.min(totalAmount / goalAmount, 1));
  const ripple = useSharedValue(0);
  const wavePrimary = useSharedValue(0);
  const waveSecondary = useSharedValue(0);
  const completionGlow = useSharedValue(totalAmount >= goalAmount ? 1 : 0);
  const previousAmount = useRef(totalAmount);
  const previousAttentionKey = useRef(attentionKey);

  const cappedProgress = Math.min(totalAmount / goalAmount, 1);
  const isComplete = totalAmount >= goalAmount;

  useEffect(() => {
    if (!continuousMotionEnabled || reduceMotion) {
      cancelAnimation(wavePrimary);
      cancelAnimation(waveSecondary);
      wavePrimary.value = withTiming(0, { duration: 120 });
      waveSecondary.value = withTiming(0, { duration: 120 });
      return;
    }

    wavePrimary.value = withRepeat(
      withTiming(-RING_SIZE * 0.32, {
        duration: 9000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    waveSecondary.value = withRepeat(
      withTiming(RING_SIZE * 0.22, {
        duration: 12000,
        easing: Easing.linear,
      }),
      -1,
      true,
    );
  }, [continuousMotionEnabled, reduceMotion, wavePrimary, waveSecondary]);

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
    transform: [{ translateY: (1 - progress.value) * GLASS_SIZE }],
  }));

  const wavePrimaryStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateX: wavePrimary.value }],
  }));

  const waveSecondaryStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : 0.42,
    transform: [{ translateX: waveSecondary.value }],
  }));

  const ripplePrimaryStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : interpolate(ripple.value, [0, 0.6, 1], [0.26, 0.12, 0]),
    transform: [
      { translateY: (1 - progress.value) * GLASS_SIZE - GLASS_SIZE / 2 },
      { scale: 0.34 + ripple.value * 0.72 },
    ],
  }));

  const rippleSecondaryStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : interpolate(ripple.value, [0, 0.18, 0.72, 1], [0, 0.18, 0.08, 0]),
    transform: [
      { translateY: (1 - progress.value) * GLASS_SIZE - GLASS_SIZE / 2 },
      { scale: 0.18 + ripple.value * 0.86 },
    ],
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
          <Animated.View pointerEvents="none" style={[styles.waveTrack, waveSecondaryStyle]}>
            <WaveLobes
              color={theme.app.colors.hydrationProgress}
              lobeHeight={30}
              lobeWidth={86}
              opacity={0.2}
              topOffset={-16}
            />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.waveTrack, wavePrimaryStyle]}>
            <WaveLobes
              color={theme.colors.primaryContainer}
              lobeHeight={34}
              lobeWidth={92}
              opacity={1}
              topOffset={-18}
            />
          </Animated.View>
        </Animated.View>
        <Animated.View
          style={[
            styles.ripple,
            {
              borderColor: theme.app.colors.hydrationProgress,
              borderRadius: RING_SIZE / 2,
            },
            ripplePrimaryStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.ripple,
            styles.rippleSecondary,
            {
              borderColor: theme.app.colors.hydrationProgress,
              borderRadius: RING_SIZE / 2,
            },
            rippleSecondaryStyle,
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

function WaveLobes({
  color,
  lobeHeight,
  lobeWidth,
  opacity,
  topOffset,
}: {
  color: string;
  lobeHeight: number;
  lobeWidth: number;
  opacity: number;
  topOffset: number;
}) {
  return (
    <View style={styles.waveLobeRow}>
      {WAVE_LOBE_INDEXES.map((index) => (
        <View
          key={index}
          style={[
            styles.waveLobe,
            {
              backgroundColor: color,
              borderRadius: lobeWidth / 2,
              height: lobeHeight,
              marginLeft: index === 0 ? 0 : -lobeWidth * 0.24,
              opacity,
              top: topOffset + (index % 2 === 0 ? 0 : 3),
              width: lobeWidth,
            },
          ]}
        />
      ))}
    </View>
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
    height: 124,
    left: (GLASS_SIZE - 124) / 2,
    position: 'absolute',
    top: (GLASS_SIZE - 124) / 2,
    width: 124,
  },
  rippleSecondary: {
    height: 96,
    left: (GLASS_SIZE - 96) / 2,
    top: (GLASS_SIZE - 96) / 2,
    width: 96,
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
  waveLobe: {
    position: 'relative',
  },
  waveLobeRow: {
    flexDirection: 'row',
  },
  waveTrack: {
    height: 38,
    left: -76,
    position: 'absolute',
    top: -1,
    width: GLASS_SIZE + 152,
  },
});
