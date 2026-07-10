import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ProgressIndicator } from './progress-indicator';
import { ScreenContainer } from './screen-container';

type OnboardingPageProps = {
  actions: ReactNode;
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
};

export function OnboardingPage({
  actions,
  children,
  currentStep,
  totalSteps,
}: OnboardingPageProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 10);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: reduceMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: reduceMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity, reduceMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ScreenContainer scrollable style={styles.screen}>
      <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
      <Animated.View style={[styles.body, animatedStyle]}>{children}</Animated.View>
      <View style={styles.actions}>{actions}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  body: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
  },
  screen: {
    gap: 28,
  },
});
