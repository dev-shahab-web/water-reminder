import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type QuickAddButtonProps = {
  amount: number;
  disabled?: boolean;
  onPress: () => void;
};

export function QuickAddButton({ amount, disabled = false, onPress }: QuickAddButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <Pressable
      accessibilityLabel={`Add ${amount} milliliters of water`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 72,
    minWidth: 88,
    padding: 12,
  },
  unit: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
