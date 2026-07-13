import { I18nManager, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { IconButton as PaperIconButton, useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type IconButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: 'back' | 'settings' | string;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const resolveIconName = (icon: IconButtonProps['icon']): string => {
  if (icon === 'back') {
    return I18nManager.isRTL ? 'arrow-right' : 'arrow-left';
  }

  if (icon === 'settings') {
    return 'cog-outline';
  }

  return icon;
};

export function IconButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
  size = 24,
  style,
}: IconButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <PaperIconButton
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      containerColor={theme.colors.surface}
      disabled={disabled}
      icon={resolveIconName(icon)}
      iconColor={theme.app.colors.textPrimary}
      mode="outlined"
      onPress={onPress}
      rippleColor={theme.colors.primaryContainer}
      size={size}
      style={[
        styles.button,
        {
          borderColor: theme.app.colors.borderSubtle,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    height: 48,
    margin: 0,
    width: 48,
  },
});
