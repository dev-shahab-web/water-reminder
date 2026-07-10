import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
};

export function PrimaryButton({ disabled = false, label, style, ...props }: PrimaryButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor: disabled ? theme.app.colors.surfaceSubtle : theme.colors.primary,
          borderRadius: theme.app.radius.md,
          opacity: state.pressed && !disabled ? 0.88 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          {
            color: disabled ? theme.app.colors.textSecondary : theme.colors.onPrimary,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
