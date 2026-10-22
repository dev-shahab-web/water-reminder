import { memo, useEffect, useId, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@shared/components/themed-text';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import type { AppTheme } from '@shared/theme';
import type { MeasurementUnit } from '@modules/settings';
import { formatMeasurementAmount } from '@modules/settings/utils/settings-options';
import type { HydrationLogFeedback } from '../types';
import {
  createWaterSimulation,
  WATER_COLUMNS,
  WATER_DROPLETS,
  waterSurfaceLevel,
  waterSurfacePath,
  waterSurfacePoint,
  type WaterDroplet,
} from '../utils/water-physics';
import { WaterSimulation } from './water-simulation';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const SIZE = 260;
const TAU = Math.PI * 2;
const CIRCUMFERENCE = TAU * 123;
const DROPS = Array.from({ length: 8 }, (_, i) => i);
const SPRAY = Array.from({ length: WATER_DROPLETS }, (_, i) => i);

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
  const disturbance = useSharedValue(capped);
  const tilt = useSharedValue(0);
  const heights = useSharedValue<number[]>(Array(WATER_COLUMNS).fill(0));
  const droplets = useSharedValue<WaterDroplet[]>(createWaterSimulation().droplets);
  const swell = useSharedValue(0);
  const splash = useSharedValue(1);
  const attention = useSharedValue(1);
  const previousFeedback = useRef(feedback?.id);
  const previousAttention = useRef(attentionKey);
  const previousTotal = useRef(totalAmount);
  const premium = theme.app.presentation.id !== 'default';
  const foreground = premium ? theme.colors.onSurface : theme.dark ? '#ECFFFD' : '#123F48';
  const secondary = premium ? theme.colors.onSurfaceVariant : theme.dark ? '#A5D9DB' : '#397080';
  const waterTop = premium ? theme.colors.primaryContainer : theme.dark ? '#278BA2' : '#A2E7ED';
  const waterBottom = premium
    ? theme.colors.secondaryContainer
    : theme.dark
      ? '#06465D'
      : '#56BCCF';

  const highlight = premium ? theme.colors.onPrimaryContainer : '#C1F5FA';

  const hasFreeSurface = capped > 0 && capped < 1;
  useEffect(() => {
    if (!animated) {
      tilt.set(0);
      heights.set(Array(WATER_COLUMNS).fill(0));
      droplets.set(createWaterSimulation().droplets);
    }
  }, [animated, droplets, heights, tilt]);

  useEffect(() => {
    disturbance.set(capped);
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
  }, [animated, capped, disturbance, feedback, progress, splash, swell, totalAmount]);

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
  // Rotate around the vessel centre, not the surface: the circular segment's
  // volume stays constant through sideways and upside-down orientations.
  const liquidStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt.value}rad` }],
  }));
  const pourProps = useAnimatedProps(() => {
    const impact = waterSurfacePoint(heights.value, progress.value, 0.6);
    return {
      d: `M ${impact.x} 19 Q ${impact.x - 5} 55 ${impact.x} ${Math.max(24, impact.y)}`,
      opacity: interpolate(splash.value, [0, 0.04, 0.22, 0.35, 1], [0, 0.75, 0.6, 0, 0]),
      strokeWidth: 4 + swell.value * 2,
    };
  });
  const rippleProps = useAnimatedProps(() => {
    const impact = waterSurfacePoint(heights.value, progress.value, 0.6);
    return {
      cx: impact.x,
      cy: Math.max(25, impact.y),
      rx: 8 + splash.value * 92,
      ry: 2 + splash.value * 13,
      opacity: interpolate(splash.value, [0, 0.13, 0.3, 1], [0, 0.45, 0.3, 0]),
    };
  });
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
      {animated ? (
        <WaterSimulation
          hasFreeSurface={hasFreeSurface}
          disturbance={disturbance}
          tilt={tilt}
          heights={heights}
          droplets={droplets}
          progress={progress}
        />
      ) : null}
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
            {
              borderColor: complete
                ? theme.app.colors.hydrationComplete
                : premium
                  ? theme.colors.primary
                  : '#44BCD0',
            },
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
            backgroundColor: premium ? theme.colors.surface : theme.dark ? '#102E3C' : '#EDF8FA',
          }}
        >
          <Animated.View style={[StyleSheet.absoluteFill, liquidStyle]}>
            <WaterLayer
              heights={heights}
              progress={progress}
              size={size}
              rear
              topColor={
                premium ? theme.colors.tertiaryContainer : theme.dark ? '#3AB2BA' : '#62CBD7'
              }
              bottomColor={waterBottom}
              highlightColor={highlight}
            />
            <WaterLayer
              heights={heights}
              progress={progress}
              size={size}
              topColor={waterTop}
              bottomColor={waterBottom}
              highlightColor={highlight}
            />
            <Svg
              width={size}
              height={size}
              viewBox="0 0 260 260"
              accessible={false}
              style={{ position: 'absolute', left: (-21 * size) / SIZE, top: (-21 * size) / SIZE }}
            >
              <AnimatedPath
                animatedProps={pourProps}
                fill="none"
                stroke={highlight}
                strokeLinecap="round"
              />
              <AnimatedEllipse
                animatedProps={rippleProps}
                fill="none"
                stroke={premium ? highlight : '#D9FCFF'}
                strokeWidth="1.5"
              />
              {DROPS.map((index) => (
                <SplashDroplet
                  key={index}
                  index={index}
                  splash={splash}
                  progress={progress}
                  color={premium ? highlight : '#E5FCFF'}
                />
              ))}
              {SPRAY.map((index) => (
                <WaveDroplet
                  key={index}
                  index={index}
                  droplets={droplets}
                  progress={progress}
                  color={highlight}
                />
              ))}
            </Svg>
          </Animated.View>
        </View>
        <Svg width="100%" height="100%" viewBox="0 0 260 260" accessible={false}>
          <Defs>
            <LinearGradient id={`${id}-rim`} x1="0" x2="1" y1="0" y2="1">
              <Stop
                offset="0"
                stopColor={
                  premium ? theme.colors.primaryContainer : theme.dark ? '#458898' : '#FFFFFF'
                }
              />
              <Stop
                offset="0.5"
                stopColor={
                  premium ? theme.colors.secondaryContainer : theme.dark ? '#1A5365' : '#D1EBF0'
                }
              />
              <Stop
                offset="1"
                stopColor={
                  premium ? theme.colors.tertiaryContainer : theme.dark ? '#1D5868' : '#ABCED7'
                }
              />
            </LinearGradient>
          </Defs>
          <Circle
            cx="130"
            cy="130"
            r="123"
            fill="none"
            stroke={premium ? theme.colors.surfaceVariant : theme.dark ? '#25414A' : '#E0EDF0'}
            strokeWidth="4"
          />
          <AnimatedCircle
            cx="130"
            cy="130"
            r="123"
            fill="none"
            stroke={
              complete
                ? theme.app.colors.hydrationComplete
                : premium
                  ? theme.colors.primary
                  : '#269AAF'
            }
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
          <Path
            d="M49 105 A88 88 0 0 1 104 46"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={theme.dark ? 0.08 : 0.55}
          />
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
              {
                backgroundColor: premium
                  ? theme.colors.surface
                  : theme.dark
                    ? '#103C4BE6'
                    : '#FFFFFFB8',
              },
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
            {
              backgroundColor: premium ? theme.colors.primary : theme.dark ? '#DDFBFA' : '#164F5A',
            },
            badgeStyle,
          ]}
        >
          <Text
            style={[
              styles.addedText,
              { color: premium ? theme.colors.onPrimary : theme.dark ? '#164F5A' : '#FFFFFF' },
            ]}
          >
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

// A small, deformable surface mesh. Paths update only while the simulation is
// awake; gradients, glass, text and the rest of the screen remain unchanged.
const WaterLayer = memo(function WaterLayer({
  heights,
  progress,
  size,
  topColor,
  bottomColor,
  highlightColor,
  rear = false,
}: {
  heights: SharedValue<number[]>;
  progress: SharedValue<number>;
  size: number;
  topColor: string;
  bottomColor: string;
  highlightColor: string;
  rear?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const props = useAnimatedProps(() => ({
    d: waterSurfacePath(heights.value, progress.value, rear),
    opacity: progress.value <= 0 ? 0 : rear ? 0.4 : 1,
  }));
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 260 260"
      accessible={false}
      style={{ position: 'absolute', left: (-21 * size) / SIZE, top: (-21 * size) / SIZE }}
    >
      <Defs>
        <LinearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={topColor} />
          <Stop offset="1" stopColor={bottomColor} />
        </LinearGradient>
      </Defs>
      <AnimatedPath
        animatedProps={props}
        fill={`url(#${id}-water)`}
        stroke={highlightColor}
        strokeWidth={rear ? 0.5 : 1.2}
      />
    </Svg>
  );
});

function WaveDroplet({
  index,
  droplets,
  progress,
  color,
}: {
  index: number;
  droplets: SharedValue<WaterDroplet[]>;
  progress: SharedValue<number>;
  color: string;
}) {
  const props = useAnimatedProps(() => {
    const drop = droplets.value[index];
    const level = waterSurfaceLevel(progress.value);
    const halfWidth = Math.sqrt(Math.max(1, 109 * 109 - Math.pow(level - 130, 2)));
    const fade = Math.max(0, Math.min(1, progress.value * 10, (1 - progress.value) * 10));
    return {
      cx: 130 + ((drop.x - 130) / 109) * halfWidth,
      cy: level + drop.y * fade,
      r: 1.1 + (index % 3) * 0.45,
      opacity: drop.life > 0 ? Math.min(0.85, drop.life * 3) * fade : 0,
    };
  });
  return <AnimatedCircle animatedProps={props} fill={color} />;
}

function SplashDroplet({
  color,
  index,
  splash,
  progress,
}: {
  color: string;
  index: number;
  splash: SharedValue<number>;
  progress: SharedValue<number>;
}) {
  const props = useAnimatedProps(() => {
    const t = Math.max(0, Math.min(1, (splash.value - 0.07 - index * 0.018) / 0.56));
    return {
      cx: 153 + (index - 3.5) * 19 * t,
      cy:
        Math.max(28, waterSurfaceLevel(progress.value)) -
        Math.sin(t * Math.PI) * (20 + (index % 4) * 9) +
        t * 8,
      r: (2.2 + (index % 3) * 0.55) * (1 - t * 0.55),
      opacity: t > 0 && t < 1 ? Math.sin(t * Math.PI) * 0.85 : 0,
    };
  });
  return <AnimatedCircle animatedProps={props} fill={color} />;
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
