import { type ReactNode, memo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@shared/components/themed-text';
import { Icon, useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type SettingsRowProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  controlLayout?: 'inline' | 'stacked';
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
  controlLayout = 'inline',
  destructive = false,
  icon,
  label,
  onPress,
  supportingText,
  value,
}: SettingsRowProps) {
  const theme = useTheme<AppTheme>();
  const { fontScale } = useWindowDimensions();
  const iconColor = destructive ? theme.app.colors.statusError : theme.app.colors.textSecondary;
  const hasInlineControls = children !== undefined;
  const shouldStackControls = hasInlineControls && (controlLayout === 'stacked' || fontScale > 1.3);

  const content = (
    <>
      <View
        style={[styles.heading, shouldStackControls ? styles.headingStacked : styles.headingInline]}
      >
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
      </View>
      {value === undefined ? (
        children === undefined ? null : (
          <View
            style={[
              styles.control,
              shouldStackControls ? styles.controlStacked : styles.controlInline,
            ]}
          >
            {children}
          </View>
        )
      ) : (
        <View style={styles.valueWrapper}>
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
        </View>
      )}
    </>
  );
  const rowStyle = [styles.row, shouldStackControls ? styles.rowStacked : styles.rowInline];

  if (onPress === undefined) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [rowStyle, { opacity: pressed ? 0.72 : 1 }]}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  control: {
    minWidth: 0,
  },
  controlInline: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  controlStacked: {
    alignSelf: 'stretch',
    width: '100%',
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
  },
  headingInline: {
    flex: 1,
  },
  headingStacked: {
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  iconShell: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    flexShrink: 0,
    justifyContent: 'center',
    width: 40,
  },
  label: {
    fontWeight: '700',
  },
  row: {
    gap: 12,
    minHeight: 56,
    width: '100%',
  },
  rowInline: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowStacked: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  supportingText: {},
  value: {
    flexShrink: 1,
    fontWeight: '700',
    minWidth: 0,
    textAlign: 'right',
  },
  valueWrapper: {
    flexShrink: 1,
    maxWidth: '40%',
    minWidth: 0,
  },
});
