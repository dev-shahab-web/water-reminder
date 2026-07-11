import { type ReactNode, memo } from 'react';
import { type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { motionDuration } from './motion-tokens';

type AnimatedCardProps = ViewProps & {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

export const AnimatedCard = memo(function AnimatedCard({
  children,
  delay = 0,
  style,
  ...props
}: AnimatedCardProps) {
  const reduceMotion = useReducedMotion();
  const entering = reduceMotion
    ? undefined
    : FadeInDown.duration(motionDuration.standard).delay(delay).easing(Easing.out(Easing.cubic));

  return (
    <Animated.View entering={entering} style={style} {...props}>
      {children}
    </Animated.View>
  );
});
