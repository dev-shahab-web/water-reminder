import { type ReactNode, type ComponentProps, memo } from 'react';
import Animated from 'react-native-reanimated';

import { GlassSurface, type GlassSurfaceProps } from '../components/glass-surface';
import { useAppReduceMotion } from './motion-provider';

export const AnimatedGlassSurface = Animated.createAnimatedComponent(GlassSurface);

type AnimatedCardProps = GlassSurfaceProps &
  Pick<ComponentProps<typeof Animated.View>, 'entering' | 'exiting' | 'layout'> & {
    children: ReactNode;
  };

export const AnimatedCard = memo(function AnimatedCard({
  children,
  entering,
  exiting,
  layout,
  style,
  ...props
}: AnimatedCardProps) {
  const reduceMotion = useAppReduceMotion();
  // The native stack owns screen transitions. Animate cards only for an explicit
  // content change, rather than replaying staggered entrances on navigation.
  return (
    <AnimatedGlassSurface
      entering={reduceMotion ? undefined : entering}
      exiting={reduceMotion ? undefined : exiting}
      layout={reduceMotion ? undefined : layout}
      style={style}
      {...props}
    >
      {children}
    </AnimatedGlassSurface>
  );
});
