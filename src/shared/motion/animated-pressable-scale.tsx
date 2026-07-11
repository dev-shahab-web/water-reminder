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
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { getMotionDuration, motionDuration } from './motion-tokens';

type AnimatedPressableScaleProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  pressedScale?: number;
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

export const AnimatedPressableScale = memo(function AnimatedPressableScale({
  children,
  disabled = false,
  onPressIn,
  onPressOut,
  pressedScale = 0.985,
  style,
  ...props
}: AnimatedPressableScaleProps) {
  const reduceMotion = useReducedMotion();
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
      <Pressable
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
      </Pressable>
    </Animated.View>
  );
});
