import { memo, useEffect, useId, useRef } from 'react';
import { StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
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
  RadialGradient,
  Stop,
} from 'react-native-svg';

import type { AppTheme } from '@shared/theme';
import type { MeasurementUnit } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';
import type { HydrationLogFeedback } from '../types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedInput = Animated.createAnimatedComponent(TextInput);
const SIZE = 260;
const TAU = Math.PI * 2;
const CIRCUMFERENCE = TAU * 123;
const DROPS = Array.from({ length: 8 }, (_, i) => i);
const BUBBLES = [0, 1, 2, 3, 4];

// Two travelling harmonics deform the actual surface on the UI thread. Both
// phases join at 2pi, so there is no visible jump when a wave cycle repeats.
function waterPath(fill: number, phase: number, swell: number, rear = false, closed = true) {
  'worklet';
  const level = 242 - fill * 224 + (rear ? -3 : 0);
  const edge = Math.sin(Math.PI * fill);
  const amplitude = (rear ? 3.4 : 4.6) + swell * 8;
  const surface = (x: number) =>
    level +
    edge *
      (Math.sin(x / 43 + (rear ? -phase : phase) + (rear ? 1.5 : 0)) * amplitude +
        Math.sin(x / 23 - phase * 2) * (1.4 + swell * 2));
  let path = `M 0 ${surface(0).toFixed(2)}`;
  for (let x = 10; x <= SIZE; x += 10) {
    path += ` L ${x} ${surface(x).toFixed(2)}`;
  }
  return closed ? `${path} L 260 260 L 0 260 Z` : path;
}

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
  const count = useSharedValue(totalAmount);
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
    count.value = animated
      ? withTiming(totalAmount, { duration: 900, easing: Easing.out(Easing.cubic) })
      : totalAmount;
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
  }, [animated, capped, count, feedback, progress, splash, swell, totalAmount]);

  useEffect(() => {
    if (attentionKey !== undefined && attentionKey !== previousAttention.current && animated) {
      attention.value = 0;
      attention.value = withTiming(1, { duration: 900 });
    }
    previousAttention.current = attentionKey;
    if (!animated) attention.value = 1;
  }, [animated, attention, attentionKey]);

  const rearProps = useAnimatedProps(() => ({
    d: waterPath(progress.value, phase.value, swell.value, true),
  }));
  const frontProps = useAnimatedProps(() => ({
    d: waterPath(progress.value, phase.value, swell.value),
  }));
  const edgeProps = useAnimatedProps(() => ({
    d: waterPath(progress.value, phase.value, swell.value, false, false),
  }));
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
  const countProps = useAnimatedProps(() => {
    const amount = measurementUnit === 'oz' ? count.value / 29.5735 : count.value;
    const text =
      measurementUnit === 'oz'
        ? amount.toFixed(2).replace(/\.?0+$/, '')
        : String(Math.round(amount));
    return { text, defaultValue: text };
  });

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
        <Svg width="100%" height="100%" viewBox="0 0 260 260" accessible={false}>
          <Defs>
            <ClipPath id={`${id}-glass`}>
              <Circle cx="130" cy="130" r="109" />
            </ClipPath>
            <LinearGradient id={`${id}-water`} x1="0" x2="0.25" y1="0" y2="1">
              <Stop offset="0" stopColor={waterTop} />
              <Stop offset="1" stopColor={waterBottom} />
            </LinearGradient>
            <RadialGradient id={`${id}-air`} cx="0.35" cy="0.25" r="0.8">
              <Stop offset="0" stopColor={theme.dark ? '#143F4A' : '#FFFFFF'} />
              <Stop offset="1" stopColor={theme.dark ? '#102E3C' : '#EDF8FA'} />
            </RadialGradient>
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
          <Circle cx="130" cy="130" r="109" fill={`url(#${id}-air)`} />
          <G clipPath={`url(#${id}-glass)`}>
            <AnimatedPath
              animatedProps={rearProps}
              fill={theme.dark ? '#3AB2BA' : '#62CBD7'}
              opacity={0.38}
            />
            <AnimatedPath animatedProps={frontProps} fill={`url(#${id}-water)`} />
            <AnimatedPath
              animatedProps={edgeProps}
              fill="none"
              stroke={theme.dark ? '#8DE3E5' : '#E8FFFF'}
              strokeWidth="1.6"
              opacity={0.8}
              strokeLinejoin="round"
            />
            {BUBBLES.map((index) => (
              <WaterBubble
                key={index}
                index={index}
                phase={phase}
                progress={progress}
                visible={animated}
              />
            ))}
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
          <AnimatedInput
            editable={false}
            caretHidden
            underlineColorAndroid="transparent"
            defaultValue={String(totalAmount)}
            animatedProps={countProps}
            style={[
              styles.amount,
              { color: foreground, fontFamily: theme.app.typography.fontFamily.display },
            ]}
            maxFontSizeMultiplier={1.2}
          />
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

function WaterBubble({
  index,
  phase,
  progress,
  visible,
}: {
  index: number;
  phase: SharedValue<number>;
  progress: SharedValue<number>;
  visible: boolean;
}) {
  const props = useAnimatedProps(() => {
    const travel = (phase.value / TAU + index * 0.193) % 1;
    const cy = 241 - travel * 176;
    const surface = 242 - progress.value * 224;
    return {
      cx: 50 + index * 39 + Math.sin(phase.value + index) * 5,
      cy,
      r: 1.4 + (index % 3) * 0.7,
      opacity: visible && cy > surface + 10 ? Math.sin(travel * Math.PI) * 0.38 : 0,
    };
  });
  return <AnimatedCircle animatedProps={props} fill="none" stroke="#D6FAFF" strokeWidth="1" />;
}

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
