import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type QuickAddButtonProps = {
  amount: number;
  disabled?: boolean;
  onPress: () => void;
};

export const QuickAddButton = memo(function QuickAddButton({
  amount,
  disabled = false,
  onPress,
}: QuickAddButtonProps) {
  const theme = useTheme<AppTheme>();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatePress = (nextScale: number) => {
    scale.value = withTiming(nextScale, {
      duration: reduceMotion ? 0 : 120,
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <Pressable
      accessibilityLabel={`Add ${amount} milliliters of water`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) {
          animatePress(0.98);
        }
      }}
      onPressOut={() => {
        animatePress(1);
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
          opacity: disabled ? 0.48 : pressed ? 0.76 : 1,
        },
      ]}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text
          style={[
            styles.amount,
            {
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.subtitle,
              lineHeight: theme.app.typography.lineHeight.subtitle,
            },
          ]}
        >
          {amount}
        </Text>
        <Text
          style={[
            styles.unit,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          ml
        </Text>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  amount: {
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    flexBasis: 112,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 72,
    minWidth: 88,
    padding: 12,
  },
  content: {
    alignItems: 'center',
  },
  unit: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
