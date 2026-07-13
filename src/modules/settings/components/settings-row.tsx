import { type ReactNode, memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type SettingsRowProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  destructive?: boolean;
  icon?: string;
  label: string;
  onPress?: () => void;
  supportingText?: string;
  value?: string;
};

export const SettingsRow = memo(function SettingsRow({
  accessibilityLabel,
  children,
  destructive = false,
  icon,
  label,
  onPress,
  supportingText,
  value,
}: SettingsRowProps) {
  const theme = useTheme<AppTheme>();
  const iconColor = destructive ? theme.app.colors.statusError : theme.app.colors.textSecondary;
  const content = (
    <>
      {icon === undefined ? null : (
        <View
          style={[
            styles.iconShell,
            {
              backgroundColor: theme.app.colors.surfaceSubtle,
              borderColor: theme.app.colors.borderSubtle,
              borderRadius: theme.app.radius.md,
            },
          ]}
        >
          <Icon color={iconColor} size={20} source={icon} />
        </View>
      )}
      <View style={styles.copy}>
        <Text
          style={[
            styles.label,
            {
              color: destructive ? theme.app.colors.statusError : theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.body,
              lineHeight: theme.app.typography.lineHeight.body,
            },
          ]}
        >
          {label}
        </Text>
        {supportingText === undefined ? null : (
          <Text
            style={[
              styles.supportingText,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.caption,
                lineHeight: theme.app.typography.lineHeight.caption,
              },
            ]}
          >
            {supportingText}
          </Text>
        )}
      </View>
      {value === undefined ? (
        children
      ) : (
        <Text
          style={[
            styles.value,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.body,
              lineHeight: theme.app.typography.lineHeight.body,
            },
          ]}
        >
          {value}
        </Text>
      )}
    </>
  );

  if (onPress === undefined) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.72 : 1 }]}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  iconShell: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  label: {
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 56,
  },
  supportingText: {},
  value: {
    flexShrink: 0,
    fontWeight: '700',
  },
});
