import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, UIManager, View } from 'react-native';
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
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

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
const WAVE_BASELINE = 8;
const WAVE_CANVAS_WIDTH = GLASS_SIZE * 2.4;
const WAVE_CANVAS_HEIGHT = GLASS_SIZE + WAVE_BASELINE;
const SEGMENT_COUNT = 48;
const SEGMENT_INDEXES = Array.from({ length: SEGMENT_COUNT }, (_, index) => index);
const HAS_NATIVE_SVG = hasNativeSvgSupport();

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
  const previousAmount = useRef(totalAmount);
  const previousAttentionKey = useRef(attentionKey);

  const cappedProgress = Math.min(totalAmount / goalAmount, 1);
  const isComplete = totalAmount >= goalAmount;
  const isDarkMode = theme.dark;
  const textShadow = getTextShadow(isDarkMode);
  const waterVisuals = isDarkMode
    ? {
        baseFill: 'rgba(8, 103, 101, 0.68)',
        frontWave: '#8DE8DD',
        frontWaveOpacity: 0.28,
        gradientBottom: '#044846',
        gradientMiddle: '#086765',
        gradientTop: '#128C83',
        highlight: 'rgba(215, 255, 249, 0.52)',
        rearHighlight: 'rgba(142, 232, 221, 0.18)',
        rearWave: '#157E78',
        rearWaveOpacity: 0.14,
      }
    : {
        baseFill: theme.colors.primaryContainer,
        frontWave: '#5CD5CF',
        frontWaveOpacity: 0.36,
        gradientBottom: '#65CFC9',
        gradientMiddle: '#8FE3DC',
        gradientTop: '#C9F6F1',
        highlight: 'rgba(255, 255, 255, 0.58)',
        rearHighlight: 'rgba(255, 255, 255, 0.22)',
        rearWave: theme.app.colors.hydrationProgress,
        rearWaveOpacity: 0.2,
      };

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

    previousAmount.current = totalAmount;
    previousAttentionKey.current = attentionKey;
  }, [
    attentionKey,
    cappedProgress,
    goalAmount,
    isComplete,
    progress,
    reduceMotion,
    ripple,
    totalAmount,
  ]);

  const waterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * GLASS_SIZE - WAVE_BASELINE }],
  }));

  const wavePrimaryStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateX: wavePrimary.value * 0.72 }],
  }));

  const waveSecondaryStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.72 : 1,
    transform: [{ translateX: waveSecondary.value * 0.58 }],
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
              opacity: isDarkMode ? 1 : 0.76,
            },
            waterStyle,
          ]}
        >
          {HAS_NATIVE_SVG ? (
            <>
              <LiquidSvgLayer
                gradientBottom={waterVisuals.gradientBottom}
                gradientMiddle={waterVisuals.gradientMiddle}
                gradientTop={waterVisuals.gradientTop}
                highlightColor={waterVisuals.highlight}
              />
              <Animated.View
                pointerEvents="none"
                style={[styles.svgWaveLayer, styles.rearWaveLayer, waveSecondaryStyle]}
              >
                <SurfaceWaveSvg
                  color={waterVisuals.rearWave}
                  highlightColor={waterVisuals.rearHighlight}
                  highlightPath={REAR_HIGHLIGHT_PATH}
                  opacity={waterVisuals.rearWaveOpacity}
                  path={REAR_WAVE_PATH}
                />
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.svgWaveLayer, wavePrimaryStyle]}>
                <SurfaceWaveSvg
                  color={waterVisuals.frontWave}
                  highlightColor={waterVisuals.highlight}
                  highlightPath={FRONT_HIGHLIGHT_PATH}
                  opacity={waterVisuals.frontWaveOpacity}
                  path={FRONT_WAVE_PATH}
                />
              </Animated.View>
            </>
          ) : (
            <FallbackLiquidLayer
              fillColor={waterVisuals.baseFill}
              highlightColor={waterVisuals.highlight}
            />
          )}
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
                ...textShadow,
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
                ...textShadow,
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
  const textShadow = getTextShadow(theme.dark);

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
          ...textShadow,
        },
      ]}
    />
  );
}

function LiquidSvgLayer({
  gradientBottom,
  gradientMiddle,
  gradientTop,
  highlightColor,
}: {
  gradientBottom: string;
  gradientMiddle: string;
  gradientTop: string;
  highlightColor: string;
}) {
  return (
    <Svg
      height={WAVE_CANVAS_HEIGHT}
      pointerEvents="none"
      style={styles.svgBaseLayer}
      viewBox={`0 0 ${GLASS_SIZE} ${WAVE_CANVAS_HEIGHT}`}
      width={GLASS_SIZE}
    >
      <Defs>
        <LinearGradient id="hydrationWaterGradient" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={gradientTop} stopOpacity="0.72" />
          <Stop offset="0.42" stopColor={gradientMiddle} stopOpacity="0.86" />
          <Stop offset="1" stopColor={gradientBottom} stopOpacity="0.98" />
        </LinearGradient>
      </Defs>
      <Path d={BASE_WATER_PATH} fill="url(#hydrationWaterGradient)" opacity={0.88} />
      <Path
        d={BASE_HIGHLIGHT_PATH}
        fill="none"
        opacity={0.22}
        stroke={highlightColor}
        strokeLinecap="round"
        strokeWidth={1.4}
      />
    </Svg>
  );
}

function SurfaceWaveSvg({
  color,
  highlightColor,
  highlightPath,
  opacity,
  path,
}: {
  color: string;
  highlightColor: string;
  highlightPath: string;
  opacity: number;
  path: string;
}) {
  return (
    <Svg
      height={WAVE_CANVAS_HEIGHT}
      pointerEvents="none"
      viewBox={`0 0 ${WAVE_CANVAS_WIDTH} ${WAVE_CANVAS_HEIGHT}`}
      width={WAVE_CANVAS_WIDTH}
    >
      <Path d={path} fill={color} opacity={opacity} />
      <Path
        d={highlightPath}
        fill="none"
        opacity={0.72}
        stroke={highlightColor}
        strokeLinecap="round"
        strokeWidth={1.15}
      />
    </Svg>
  );
}

function FallbackLiquidLayer({
  fillColor,
  highlightColor,
}: {
  fillColor: string;
  highlightColor: string;
}) {
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.fallbackLiquidFill,
          {
            backgroundColor: fillColor,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.fallbackLiquidHighlight,
          {
            backgroundColor: highlightColor,
          },
        ]}
      />
    </>
  );
}

type WavePathConfig = {
  amplitude: number;
  baseline: number;
  height?: number;
  phase: number;
  wavelength: number;
  width: number;
};

function createWaveFillPath(config: Required<WavePathConfig>) {
  const surfacePath = createWaveStrokePath(config);

  return `${surfacePath} L ${config.width} ${config.height} L 0 ${config.height} Z`;
}

function createWaveStrokePath({ amplitude, baseline, phase, wavelength, width }: WavePathConfig) {
  const segmentWidth = 18;
  const yForX = (x: number) =>
    baseline + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude;

  let path = `M 0 ${formatPathNumber(yForX(0))}`;

  for (let x = segmentWidth; x < width; x += segmentWidth) {
    const endX = Math.min(x, width);
    const controlX = endX - segmentWidth / 2;
    path += ` Q ${formatPathNumber(controlX)} ${formatPathNumber(
      yForX(controlX),
    )} ${formatPathNumber(endX)} ${formatPathNumber(yForX(endX))}`;
  }

  const controlX = width - segmentWidth / 2;
  path += ` Q ${formatPathNumber(controlX)} ${formatPathNumber(
    yForX(controlX),
  )} ${formatPathNumber(width)} ${formatPathNumber(yForX(width))}`;

  return path;
}

function formatPathNumber(value: number) {
  return Number(value.toFixed(2));
}

function getTextShadow(isDarkMode: boolean) {
  return {
    textShadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.32)' : 'rgba(255, 255, 255, 0.48)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  };
}

function hasNativeSvgSupport() {
  try {
    return Boolean(
      UIManager.getViewManagerConfig('RNSVGPath') &&
      UIManager.getViewManagerConfig('RNSVGLinearGradient'),
    );
  } catch {
    return false;
  }
}

const BASE_WATER_PATH = createWaveFillPath({
  amplitude: 3.2,
  baseline: WAVE_BASELINE + 0.5,
  height: WAVE_CANVAS_HEIGHT,
  phase: 1.35,
  wavelength: 150,
  width: GLASS_SIZE,
});
const BASE_HIGHLIGHT_PATH = createWaveStrokePath({
  amplitude: 3.2,
  baseline: WAVE_BASELINE + 0.5,
  phase: 1.35,
  wavelength: 150,
  width: GLASS_SIZE,
});
const FRONT_WAVE_PATH = createWaveFillPath({
  amplitude: 4,
  baseline: WAVE_BASELINE,
  height: WAVE_CANVAS_HEIGHT,
  phase: 0.7,
  wavelength: 132,
  width: WAVE_CANVAS_WIDTH,
});
const REAR_WAVE_PATH = createWaveFillPath({
  amplitude: 3,
  baseline: WAVE_BASELINE + 2,
  height: WAVE_CANVAS_HEIGHT,
  phase: 2.2,
  wavelength: 154,
  width: WAVE_CANVAS_WIDTH,
});
const FRONT_HIGHLIGHT_PATH = createWaveStrokePath({
  amplitude: 4,
  baseline: WAVE_BASELINE,
  phase: 0.7,
  wavelength: 132,
  width: WAVE_CANVAS_WIDTH,
});
const REAR_HIGHLIGHT_PATH = createWaveStrokePath({
  amplitude: 3,
  baseline: WAVE_BASELINE + 2,
  phase: 2.2,
  wavelength: 154,
  width: WAVE_CANVAS_WIDTH,
});

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
    zIndex: 5,
  },
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  glass: {
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    height: RING_SIZE - 36,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#007A8A',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    width: RING_SIZE - 36,
  },
  fallbackLiquidFill: {
    bottom: 0,
    left: 0,
    opacity: 0.88,
    position: 'absolute',
    right: 0,
    top: WAVE_BASELINE,
  },
  fallbackLiquidHighlight: {
    height: 2,
    left: 44,
    opacity: 0.34,
    position: 'absolute',
    right: 44,
    top: WAVE_BASELINE,
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
    zIndex: 4,
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
    position: 'absolute',
    width: '100%',
  },
  svgBaseLayer: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  svgWaveLayer: {
    left: -(WAVE_CANVAS_WIDTH - GLASS_SIZE) / 2,
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  rearWaveLayer: {
    zIndex: 1,
  },
});
