import { StyleSheet, Text, type PressableProps } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { AnimatedPressableScale } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

type SecondaryButtonProps = PressableProps & {
  icon?: string;
  label: string;
};

export function SecondaryButton({
  disabled = false,
  icon,
  label,
  style,
  ...props
}: SecondaryButtonProps) {
  const theme = useTheme<AppTheme>();
  const contentColor = theme.app.colors.textPrimary;

  return (
    <AnimatedPressableScale
      accessibilityRole="button"
      disabled={disabled}
      pressedScale={0.982}
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
      {icon === undefined ? null : <Icon color={contentColor} size={20} source={icon} />}
      <Text
        style={[
          styles.label,
          {
            color: contentColor,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
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
