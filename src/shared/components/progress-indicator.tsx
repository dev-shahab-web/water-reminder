import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import { useEffect } from 'react';

import type { AppTheme } from '@shared/theme';

type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const theme = useTheme<AppTheme>();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(currentStep / totalSteps);

  useEffect(() => {
    progress.value = withTiming(currentStep / totalSteps, {
      duration: reduceMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStep, progress, reduceMotion, totalSteps]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityRole="progressbar"
      style={[
        styles.track,
        {
          backgroundColor: theme.app.colors.surfaceSubtle,
          borderRadius: theme.app.radius.full,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: theme.app.colors.hydrationProgress,
            borderRadius: theme.app.radius.full,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    height: '100%',
    transformOrigin: 'left',
    width: '100%',
  },
  track: {
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
});
