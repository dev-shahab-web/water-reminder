import { I18nManager, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

import { AnimatedPressableScale } from '@shared/motion';
import type { AppTheme } from '@shared/theme';
import {
  type MaterialCommunityIconName,
  resolveMaterialCommunityIconName,
  PaperMaterialCommunityIcon,
} from './material-community-icon';

type IconButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: 'back' | 'settings' | string;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const resolveIconName = (icon: IconButtonProps['icon']): MaterialCommunityIconName => {
  if (icon === 'back') {
    return I18nManager.isRTL ? 'arrow-right' : 'arrow-left';
  }

  if (icon === 'settings') {
    return 'cog-outline';
  }

  return resolveMaterialCommunityIconName(icon);
};

export function IconButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
  size = 22,
  style,
}: IconButtonProps) {
  const theme = useTheme<AppTheme>();
  const iconColor = disabled ? theme.app.colors.textSecondary : theme.app.colors.textPrimary;

  return (
    <AnimatedPressableScale
      glass="inset"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.96}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: theme.app.radius.md,
          opacity: disabled ? 0.5 : pressed ? 0.72 : 1,
        },
        style,
      ]}
    >
      <PaperMaterialCommunityIcon color={iconColor} name={resolveIconName(icon)} size={size} />
    </AnimatedPressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    margin: 0,
    padding: 0,
    width: 48,
  },
});
