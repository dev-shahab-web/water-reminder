import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { AnimatedPressableScale } from '@shared/motion';
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

  return (
    <AnimatedPressableScale
      accessibilityLabel={`Add ${amount} milliliters of water`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.975}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
          elevation: disabled ? 0 : 1,
          opacity: disabled ? 0.48 : pressed ? 0.76 : 1,
          shadowColor: theme.app.colors.hydrationProgress,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon color={theme.app.colors.hydrationProgress} size={18} source="water" />
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
      </View>
    </AnimatedPressableScale>
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
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  content: {
    alignItems: 'center',
    gap: 2,
  },
  unit: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
