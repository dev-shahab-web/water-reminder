import { memo, useEffect, useRef } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motionDuration } from './motion-tokens';

type AnimatedCounterProps = {
  style?: StyleProp<TextStyle>;
  value: number;
};

export const AnimatedCounter = memo(function AnimatedCounter({
  style,
  value,
}: AnimatedCounterProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) {
      return;
    }

    opacity.value = reduceMotion ? 1 : 0.38;
    translateY.value = reduceMotion ? 0 : 5;
    opacity.value = withTiming(1, {
      duration: reduceMotion ? 0 : motionDuration.fast,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: reduceMotion ? 0 : motionDuration.fast,
      easing: Easing.out(Easing.cubic),
    });
    previousValue.current = value;
  }, [opacity, reduceMotion, translateY, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.Text style={[style, animatedStyle]}>{value}</Animated.Text>;
});
