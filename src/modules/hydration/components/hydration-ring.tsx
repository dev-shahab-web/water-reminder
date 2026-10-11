import { memo, useEffect, useId, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import type { AppTheme } from '@shared/theme';
import type { MeasurementUnit } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';
import type { HydrationLogFeedback } from '../types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const SIZE = 260;
const TAU = Math.PI * 2;
const CIRCUMFERENCE = TAU * 123;
const DROPS = Array.from({ length: 8 }, (_, i) => i);

type HydrationRingProps = {
  attentionKey?: string;
  continuousMotionEnabled?: boolean;
  feedback?: HydrationLogFeedback;
  goalAmount: number;
  message: string;
  measurementUnit: MeasurementUnit;
  remainingAmount: number;
  reduceMotion?: boolean;
  totalAmount: number;
};

export const HydrationRing = memo(function HydrationRing({
  attentionKey,
  continuousMotionEnabled = true,
  feedback,
  goalAmount,
  message,
  measurementUnit,
  remainingAmount,
  reduceMotion = false,
  totalAmount,
}: HydrationRingProps) {
  const theme = useTheme<AppTheme>();
  const { width } = useWindowDimensions();
  const size = Math.min(280, Math.max(208, width - 112));
  const id = useId().replace(/:/g, '');
  const capped = goalAmount > 0 ? Math.max(0, Math.min(totalAmount / goalAmount, 1)) : 0;
  const complete = goalAmount > 0 && totalAmount >= goalAmount;
  const percent = goalAmount > 0 ? Math.round((totalAmount / goalAmount) * 100) : 0;
  const animated = continuousMotionEnabled && !reduceMotion;
  const progress = useSharedValue(capped);
  const phase = useSharedValue(0);
  const swell = useSharedValue(0);
  const splash = useSharedValue(1);
  const attention = useSharedValue(1);
  const previousFeedback = useRef(feedback?.id);
  const previousAttention = useRef(attentionKey);
  const previousTotal = useRef(totalAmount);
  const foreground = theme.dark ? '#ECFFFD' : '#123F48';
  const secondary = theme.dark ? '#A5D9DB' : '#397080';
  const waterTop = theme.dark ? '#278BA2' : '#A2E7ED';
  const waterBottom = theme.dark ? '#06465D' : '#56BCCF';

  const frame = useFrameCallback(({ timeSincePreviousFrame }) => {
    phase.value = (phase.value + Math.min(timeSincePreviousFrame ?? 16, 40) * 0.00155) % TAU;
  }, false);
  useEffect(() => {
    frame.setActive(animated);
    return () => frame.setActive(false);
  }, [animated, frame]);

  useEffect(() => {
    progress.value = animated
      ? withSpring(capped, { damping: 19, stiffness: 85, mass: 1.2, overshootClamping: true })
      : capped;
    if (feedback?.id !== previousFeedback.current) {
      previousFeedback.current = feedback?.id;
      if (feedback && animated) {
        swell.value = Math.min(1.4, 0.7 + feedback.amount / 1000);
        swell.value = withTiming(0, { duration: 2100, easing: Easing.out(Easing.quad) });
        splash.value = 0;
        splash.value = withTiming(1, { duration: 1700, easing: Easing.linear });
      }
    } else if (totalAmount < previousTotal.current) {
      // Undo/edit lowers the water without celebrating a new drink.
      cancelAnimation(splash);
      splash.value = 1;
    }
    if (!animated) {
      cancelAnimation(swell);
      cancelAnimation(splash);
      swell.value = 0;
      splash.value = 1;
    }
    previousTotal.current = totalAmount;
  }, [animated, capped, feedback, progress, splash, swell, totalAmount]);

  useEffect(() => {
    if (attentionKey !== undefined && attentionKey !== previousAttention.current && animated) {
      attention.value = 0;
      attention.value = withTiming(1, { duration: 900 });
    }
    previousAttention.current = attentionKey;
    if (!animated) attention.value = 1;
  }, [animated, attention, attentionKey]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));
  const pourProps = useAnimatedProps(() => ({
    d: `M 153 19 Q 148 55 153 ${Math.max(24, 242 - progress.value * 224)}`,
    opacity: interpolate(splash.value, [0, 0.04, 0.22, 0.35, 1], [0, 0.75, 0.6, 0, 0]),
    strokeWidth: 4 + swell.value * 2,
  }));
  const rippleProps = useAnimatedProps(() => ({
    cx: 153,
    cy: Math.max(25, 242 - progress.value * 224),
    rx: 8 + splash.value * 92,
    ry: 2 + splash.value * 13,
    opacity: interpolate(splash.value, [0, 0.13, 0.3, 1], [0, 0.45, 0.3, 0]),
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: Math.sin(attention.value * Math.PI) * 0.35 + Math.sin(splash.value * Math.PI) * 0.28,
    transform: [{ scale: 1 + Math.sin(splash.value * Math.PI) * 0.045 }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : interpolate(splash.value, [0, 0.12, 0.72, 1], [0, 1, 1, 0]),
    transform: [{ translateY: interpolate(splash.value, [0, 1], [8, -10]) }],
  }));
  // TextInput's animated text/defaultValue can stay at the mounted value in
  // release builds. Render the committed amount through React; animate water.
  const displayedAmount =
    measurementUnit === 'oz'
      ? (totalAmount / 29.5735).toFixed(2).replace(/\.?0+$/, '')
      : String(Math.round(totalAmount));

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Today's hydration. ${formatMeasurementAmount(totalAmount, measurementUnit)} logged. ${complete ? 'Daily goal complete.' : `${formatMeasurementAmount(remainingAmount, measurementUnit)} remaining.`}`}
        accessibilityValue={{
          min: 0,
          max: Math.max(1, goalAmount),
          now: Math.min(totalAmount, Math.max(1, goalAmount)),
          text: `${percent} percent of daily goal`,
        }}
        style={{ width: size, height: size }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            { borderColor: complete ? theme.app.colors.hydrationComplete : '#44BCD0' },
            haloStyle,
          ]}
        />
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            left: (21 * size) / SIZE,
            top: (21 * size) / SIZE,
            width: (218 * size) / SIZE,
            height: (218 * size) / SIZE,
            borderRadius: (109 * size) / SIZE,
            overflow: 'hidden',
            backgroundColor: theme.dark ? '#102E3C' : '#EDF8FA',
          }}
        >
          <WaterLayer
            phase={phase}
            progress={progress}
            size={size}
            rear
            topColor={theme.dark ? '#3AB2BA' : '#62CBD7'}
            bottomColor={waterBottom}
          />
          <WaterLayer
            phase={phase}
            progress={progress}
            size={size}
            topColor={waterTop}
            bottomColor={waterBottom}
          />
        </View>
        <Svg width="100%" height="100%" viewBox="0 0 260 260" accessible={false}>
          <Defs>
            <ClipPath id={`${id}-glass`}>
              <Circle cx="130" cy="130" r="109" />
            </ClipPath>
            <LinearGradient id={`${id}-rim`} x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor={theme.dark ? '#458898' : '#FFFFFF'} />
              <Stop offset="0.5" stopColor={theme.dark ? '#1A5365' : '#D1EBF0'} />
              <Stop offset="1" stopColor={theme.dark ? '#1D5868' : '#ABCED7'} />
            </LinearGradient>
          </Defs>
          <Circle
            cx="130"
            cy="130"
            r="123"
            fill="none"
            stroke={theme.dark ? '#25414A' : '#E0EDF0'}
            strokeWidth="4"
          />
          <AnimatedCircle
            cx="130"
            cy="130"
            r="123"
            fill="none"
            stroke={complete ? theme.app.colors.hydrationComplete : '#269AAF'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            rotation="-90"
            origin="130, 130"
            animatedProps={arcProps}
          />
          <Circle
            cx="130"
            cy="130"
            r="115"
            fill="none"
            stroke={`url(#${id}-rim)`}
            strokeWidth="2"
          />
          <G clipPath={`url(#${id}-glass)`}>
            <AnimatedPath
              animatedProps={pourProps}
              fill="none"
              stroke="#C1F5FA"
              strokeLinecap="round"
            />
            <AnimatedEllipse
              animatedProps={rippleProps}
              fill="none"
              stroke="#D9FCFF"
              strokeWidth="1.5"
            />
            {DROPS.map((index) => (
              <SplashDroplet key={index} index={index} splash={splash} progress={progress} />
            ))}
            <Path
              d="M49 105 A88 88 0 0 1 104 46"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              opacity={theme.dark ? 0.08 : 0.55}
            />
          </G>
        </Svg>
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={styles.centerCopy}
        >
          <Text maxFontSizeMultiplier={1.2} style={[styles.eyebrow, { color: secondary }]}>
            TODAY’S HYDRATION
          </Text>
          <Text
            style={[
              styles.amount,
              { color: foreground, fontFamily: theme.app.typography.fontFamily.display },
            ]}
            maxFontSizeMultiplier={1.2}
          >
            {displayedAmount}
          </Text>
          <Text style={[styles.unit, { color: secondary }]}>
            {measurementUnit === 'ml' ? 'mL' : 'oz'} of{' '}
            {formatMeasurementAmount(goalAmount, measurementUnit).replace(' ml', ' mL')}
          </Text>
          <View
            style={[
              styles.percentPill,
              { backgroundColor: theme.dark ? '#103C4BE6' : '#FFFFFFB8' },
            ]}
          >
            <Text maxFontSizeMultiplier={1.2} style={[styles.percent, { color: foreground }]}>
              {complete ? '✓ Goal reached' : `${percent}% complete`}
            </Text>
          </View>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.addedBadge,
            { backgroundColor: theme.dark ? '#DDFBFA' : '#164F5A' },
            badgeStyle,
          ]}
        >
          <Text style={[styles.addedText, { color: theme.dark ? '#164F5A' : '#FFFFFF' }]}>
            {feedback
              ? `+ ${formatMeasurementAmount(feedback.amount, measurementUnit).replace(' ml', ' mL')}`
              : ''}
          </Text>
        </Animated.View>
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.message, { color: theme.app.colors.textSecondary }]}
      >
        {message}
      </Text>
    </View>
  );
});

// Cache each wave as a texture and translate it on the compositor. Updating SVG
// paths/bubbles on every idle frame used to rasterize and upload the whole ring.
const WaterLayer = memo(function WaterLayer({
  phase,
  progress,
  size,
  topColor,
  bottomColor,
  rear = false,
}: {
  phase: SharedValue<number>;
  progress: SharedValue<number>;
  size: number;
  topColor: string;
  bottomColor: string;
  rear?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const ratio = size / SIZE;
  const style = useAnimatedStyle(() => ({
    opacity: progress.value <= 0 ? 0 : rear ? 0.38 : 1,
    transform: [
      {
        translateX:
          (rear ? -SIZE + (phase.value / TAU) * SIZE : -(phase.value / TAU) * SIZE) * ratio,
      },
      { translateY: (211 - progress.value * 224 + (rear ? -3 : 0)) * ratio },
    ],
  }));
  return (
    <Animated.View
      renderToHardwareTextureAndroid
      style={[{ position: 'absolute', width: 780 * ratio, height: 260 * ratio }, style]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 780 260">
        <Defs>
          <LinearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={topColor} />
            <Stop offset="1" stopColor={bottomColor} />
          </LinearGradient>
        </Defs>
        <Path
          d="M0 10 Q65 0 130 10 T260 10 T390 10 T520 10 T650 10 T780 10 V260 H0 Z"
          fill={`url(#${id}-water)`}
        />
        <Path
          d="M0 10 Q65 0 130 10 T260 10 T390 10 T520 10 T650 10 T780 10"
          fill="none"
          stroke="#C1F5FA"
          strokeWidth="1.5"
          opacity={0.8}
        />
      </Svg>
    </Animated.View>
  );
});

function SplashDroplet({
  index,
  splash,
  progress,
}: {
  index: number;
  splash: SharedValue<number>;
  progress: SharedValue<number>;
}) {
  const props = useAnimatedProps(() => {
    const t = Math.max(0, Math.min(1, (splash.value - 0.07 - index * 0.018) / 0.56));
    return {
      cx: 153 + (index - 3.5) * 19 * t,
      cy:
        Math.max(28, 242 - progress.value * 224) -
        Math.sin(t * Math.PI) * (20 + (index % 4) * 9) +
        t * 8,
      r: (2.2 + (index % 3) * 0.55) * (1 - t * 0.55),
      opacity: t > 0 && t < 1 ? Math.sin(t * Math.PI) * 0.85 : 0,
    };
  });
  return <AnimatedCircle animatedProps={props} fill="#E5FCFF" />;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', alignSelf: 'center', gap: 12, width: '100%' },
  halo: { ...StyleSheet.absoluteFill, borderWidth: 8, borderRadius: 999 },
  centerCopy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  amount: {
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    height: 57,
    width: '78%',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  unit: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  percentPill: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginTop: 14 },
  percent: { fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    minHeight: 19,
    paddingHorizontal: 8,
  },
  addedBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: 16,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  addedText: { fontSize: 12, fontWeight: '800' },
});
