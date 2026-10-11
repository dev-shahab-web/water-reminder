import { useAppReduceMotion } from '@shared/motion/motion-provider';
import { type ReactNode, memo } from 'react';
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { getMotionDuration, motionDuration } from './motion-tokens';
import { GlassPressable, type GlassTone } from '../components/glass-surface';

type AnimatedPressableScaleProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  glass?: GlassTone;
  selected?: boolean;
  pressedScale?: number;
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

export const AnimatedPressableScale = memo(function AnimatedPressableScale({
  children,
  disabled = false,
  glass,
  selected,
  onPressIn,
  onPressOut,
  pressedScale = 0.985,
  style,
  ...props
}: AnimatedPressableScaleProps) {
  const reduceMotion = useAppReduceMotion();
  const Surface = glass === undefined ? Pressable : GlassPressable;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animateScale = (nextScale: number) => {
    scale.value = withTiming(nextScale, {
      duration: getMotionDuration(motionDuration.fast, reduceMotion),
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Surface
        {...(glass === undefined ? {} : { tone: glass, selected })}
        disabled={disabled}
        onPressIn={(event) => {
          if (!disabled) {
            animateScale(pressedScale);
          }

          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateScale(1);
          onPressOut?.(event);
        }}
        style={style}
        {...props}
      >
        {children}
      </Surface>
    </Animated.View>
  );
});
