import { type ReactNode, type ComponentProps, memo } from 'react';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { GlassSurface, type GlassSurfaceProps } from '../components/glass-surface';
import { motionDuration } from './motion-tokens';

export const AnimatedGlassSurface = Animated.createAnimatedComponent(GlassSurface);

type AnimatedCardProps = GlassSurfaceProps &
  Pick<ComponentProps<typeof Animated.View>, 'entering' | 'exiting' | 'layout'> & {
    children: ReactNode;
    delay?: number;
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
    <AnimatedGlassSurface entering={entering} style={style} {...props}>
      {children}
    </AnimatedGlassSurface>
  );
});
