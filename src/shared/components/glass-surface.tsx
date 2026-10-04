import { BlurTargetView, BlurView } from 'expo-blur';
import {
  createContext,
  forwardRef,
  memo,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { AppTheme } from '@shared/theme';

export type GlassTone = 'regular' | 'inset' | 'elevated';
type GlassOptions = { selected?: boolean; tone?: GlassTone };
export type GlassSurfaceProps = ViewProps & GlassOptions;

const GlassSceneContext = createContext<{
  blurTarget?: RefObject<View | null>;
  reduceTransparency: boolean;
}>({ reduceTransparency: false });
const InsideGlassContext = createContext(false);
const supportsBlur = Platform.OS !== 'android' || Number(Platform.Version) >= 31;

/** A shared, background-only blur target keeps content and the water animation crisp. */
export function GlassScene({ children }: { children: ReactNode }) {
  const theme = useTheme<AppTheme>();
  const blurTarget = useRef<View>(null);
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (active) setReduceTransparency(enabled);
      })
      .catch(() => {
        if (active) setReduceTransparency(true);
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const context = useMemo(() => ({ blurTarget, reduceTransparency }), [reduceTransparency]);

  return (
    <GlassSceneContext.Provider value={context}>
      <BlurTargetView
        ref={blurTarget}
        collapsable={false}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.app.colors.surfaceBase }]}
      >
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
          <Defs>
            <RadialGradient id={`${id}-a`} cx="-8%" cy="18%" rx="100%" ry="55%">
              <Stop offset="0" stopColor={theme.dark ? '#245560' : '#BDDFE4'} stopOpacity="0.65" />
              <Stop offset="1" stopColor={theme.dark ? '#245560' : '#BDDFE4'} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={`${id}-b`} cx="112%" cy="78%" rx="98%" ry="56%">
              <Stop offset="0" stopColor={theme.dark ? '#2D365B' : '#CCD5EC'} stopOpacity="0.62" />
              <Stop offset="1" stopColor={theme.dark ? '#2D365B' : '#CCD5EC'} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={`${id}-c`} cx="90%" cy="0%" rx="90%" ry="44%">
              <Stop offset="0" stopColor={theme.dark ? '#566375' : '#FFFFFF'} stopOpacity="0.28" />
              <Stop offset="1" stopColor={theme.dark ? '#566375' : '#FFFFFF'} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="400" height="900" fill={`url(#${id}-a)`} />
          <Rect width="400" height="900" fill={`url(#${id}-b)`} />
          <Rect width="400" height="900" fill={`url(#${id}-c)`} />
        </Svg>
      </BlurTargetView>
      {children}
    </GlassSceneContext.Provider>
  );
}

function useGlassMaterial(style: StyleProp<ViewStyle>, tone: GlassTone, selected: boolean) {
  const theme = useTheme<AppTheme>();
  const insideGlass = useContext(InsideGlassContext);
  const { blurTarget, reduceTransparency } = useContext(GlassSceneContext);
  const inset = tone === 'inset' || (insideGlass && tone !== 'elevated');
  // Android modal windows cannot sample a target in another native window.
  const blur = supportsBlur && !reduceTransparency && !inset && tone !== 'elevated' && !!blurTarget;
  const suppliedRadius = StyleSheet.flatten(style)?.borderRadius;
  const radius =
    typeof suppliedRadius === 'number' || typeof suppliedRadius === 'string'
      ? suppliedRadius
      : theme.app.radius.lg;
  const dark = theme.dark;
  const elevated = tone === 'elevated';
  const backgroundColor = reduceTransparency
    ? selected
      ? theme.colors.primaryContainer
      : theme.colors.surface
    : selected
      ? dark
        ? 'rgba(36, 101, 112, 0.72)'
        : 'rgba(208, 238, 240, 0.86)'
      : inset
        ? dark
          ? 'rgba(205, 226, 246, 0.055)'
          : 'rgba(255, 255, 255, 0.24)'
        : blur
          ? dark
            ? 'rgba(20, 32, 44, 0.54)'
            : 'rgba(255, 255, 255, 0.38)'
          : dark
            ? '#1B2A38'
            : '#F3F8FC';

  return useMemo(() => {
    const materialStyle: ViewStyle = {
      backgroundColor: 'transparent',
      borderColor: selected
        ? theme.colors.primary
        : dark
          ? 'rgba(200, 224, 248, 0.14)'
          : 'rgba(110, 140, 163, 0.18)',
      borderCurve: 'continuous',
      borderRadius: radius,
      borderWidth: 1,
      // boxShadow is supported by this app's new-architecture RN runtime on both platforms.
      boxShadow: inset
        ? []
        : [
            {
              offsetX: 0,
              offsetY: elevated ? 20 : 8,
              blurRadius: elevated ? 48 : 28,
              spreadDistance: elevated ? -12 : -10,
              color: dark ? 'rgba(0, 4, 12, 0.42)' : 'rgba(40, 67, 94, 0.16)',
            },
            {
              offsetX: 0,
              offsetY: 1,
              blurRadius: 4,
              spreadDistance: -1,
              color: dark ? 'rgba(0, 4, 12, 0.24)' : 'rgba(40, 67, 94, 0.07)',
            },
          ],
      elevation: 0,
      shadowOpacity: 0,
    };

    return {
      backgroundColor,
      blur,
      blurTarget,
      dark,
      inset,
      materialStyle,
      radius,
      reduceTransparency,
    };
  }, [
    backgroundColor,
    blur,
    blurTarget,
    dark,
    elevated,
    inset,
    radius,
    reduceTransparency,
    selected,
    theme.colors.primary,
  ]);
}

type Material = ReturnType<typeof useGlassMaterial>;

const GlassLayers = memo(function GlassLayers({ material }: { material: Material }) {
  const id = useId().replace(/:/g, '');
  const { backgroundColor, blur, blurTarget, dark, inset, radius, reduceTransparency } = material;
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Measure the inner frame so both hairlines sit inside the clip, including pill-shaped cards.
  const handleLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setSize((previous) =>
      previous.width === layout.width && previous.height === layout.height
        ? previous
        : { width: layout.width, height: layout.height },
    );
  };
  const corner = Math.max(
    0,
    Math.min(
      typeof radius === 'number'
        ? radius - 1
        : (parseFloat(radius) / 100) * Math.min(size.width, size.height),
      size.width / 2,
      size.height / 2,
    ),
  );
  return (
    <View
      onLayout={handleLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: typeof radius === 'number' ? Math.max(0, radius - 1) : radius,
          overflow: 'hidden',
        },
      ]}
    >
      {blur ? (
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus"
          intensity={dark ? 30 : 38}
          tint={dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      {!reduceTransparency && size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`${id}-wash`} x1="0%" y1="0%" x2="90%" y2="100%">
              <Stop
                offset="0"
                stopColor="#FFFFFF"
                stopOpacity={inset ? 0.045 : dark ? 0.085 : 0.32}
              />
              <Stop offset="0.46" stopColor="#FFFFFF" stopOpacity={dark ? 0.008 : 0.035} />
              <Stop
                offset="1"
                stopColor={dark ? '#89B5DD' : '#BFD9ED'}
                stopOpacity={inset ? 0.01 : 0.055}
              />
            </LinearGradient>
            <LinearGradient id={`${id}-edge`} x1="8%" y1="0%" x2="88%" y2="100%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={inset ? 0.25 : dark ? 0.5 : 0.98} />
              <Stop offset="0.3" stopColor="#F3FAFF" stopOpacity={dark ? 0.12 : 0.46} />
              <Stop offset="0.58" stopColor="#FFFFFF" stopOpacity={dark ? 0.025 : 0.06} />
              <Stop
                offset="1"
                stopColor="#D9EDFF"
                stopOpacity={inset ? 0.08 : dark ? 0.24 : 0.68}
              />
            </LinearGradient>
            <RadialGradient id={`${id}-shine`} cx="10%" cy="0%" rx="84%" ry="72%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={inset ? 0 : dark ? 0.045 : 0.16} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={corner} fill={`url(#${id}-wash)`} />
          {!inset ? (
            <Rect width="100%" height="100%" rx={corner} fill={`url(#${id}-shine)`} />
          ) : null}
          <Rect
            x={0.5}
            y={0.5}
            width={Math.max(0, size.width - 1)}
            height={Math.max(0, size.height - 1)}
            rx={Math.max(0, corner - 0.5)}
            fill="none"
            stroke={`url(#${id}-edge)`}
            strokeWidth={inset ? 0.65 : 1}
          />
        </Svg>
      ) : null}
    </View>
  );
});

export const GlassSurface = forwardRef<View, GlassSurfaceProps>(function GlassSurface(
  { children, selected = false, style, tone = 'regular', ...props },
  ref,
) {
  const material = useGlassMaterial(style, tone, selected);
  return (
    <View ref={ref} style={[style, material.materialStyle]} {...props}>
      <GlassLayers material={material} />
      <InsideGlassContext.Provider value={true}>{children}</InsideGlassContext.Provider>
    </View>
  );
});

export function GlassPressable({
  children,
  selected = false,
  style,
  tone = 'regular',
  ...props
}: PressableProps & GlassOptions) {
  const baseStyle = typeof style === 'function' ? style({ pressed: false, hovered: false }) : style;
  const material = useGlassMaterial(baseStyle, tone, selected);
  return (
    <Pressable
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        material.materialStyle,
      ]}
      {...props}
    >
      {(state) => (
        <>
          <GlassLayers material={material} />
          {state.pressed ? (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: material.dark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: material.radius,
                },
              ]}
            />
          ) : null}
          <InsideGlassContext.Provider value={true}>
            {typeof children === 'function' ? children(state) : children}
          </InsideGlassContext.Provider>
        </>
      )}
    </Pressable>
  );
}
