import { type ReactNode, memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type SettingsRowProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  destructive?: boolean;
  label: string;
  onPress?: () => void;
  supportingText?: string;
  value?: string;
};

export const SettingsRow = memo(function SettingsRow({
  accessibilityLabel,
  children,
  destructive = false,
  label,
  onPress,
  supportingText,
  value,
}: SettingsRowProps) {
  const theme = useTheme<AppTheme>();
  const content = (
    <>
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
  label: {
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 52,
  },
  supportingText: {},
  value: {
    flexShrink: 0,
    fontWeight: '700',
  },
});
