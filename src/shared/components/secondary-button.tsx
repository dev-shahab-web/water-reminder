import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type SecondaryButtonProps = PressableProps & {
  label: string;
};

export function SecondaryButton({
  disabled = false,
  label,
  style,
  ...props
}: SecondaryButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
          opacity: state.pressed && !disabled ? 0.72 : disabled ? 0.5 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.app.colors.textPrimary,
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
    borderWidth: 1,
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
