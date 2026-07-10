import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type ChoiceCardProps = PressableProps & {
  description?: string;
  label: string;
  selected?: boolean;
  value?: string;
};

export function ChoiceCard({
  description,
  label,
  onPress,
  selected = false,
  style,
  value,
  ...props
}: ChoiceCardProps) {
  const theme = useTheme<AppTheme>();
  const baseStyle = [
    styles.card,
    {
      backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
      borderColor: selected ? theme.colors.primary : theme.app.colors.borderSubtle,
      borderRadius: theme.app.radius.md,
    },
  ];
  const content = (
    <>
      <View style={styles.copy}>
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
        {description === undefined ? null : (
          <Text
            style={[
              styles.description,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.caption,
                lineHeight: theme.app.typography.lineHeight.caption,
              },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
      {value === undefined ? null : (
        <Text
          style={[
            styles.value,
            {
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.subtitle,
              lineHeight: theme.app.typography.lineHeight.subtitle,
            },
          ]}
        >
          {value}
        </Text>
      )}
    </>
  );

  if (onPress === undefined) {
    return (
      <View style={[...baseStyle, typeof style === 'function' ? undefined : style]} {...props}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={(state) => [
        ...baseStyle,
        { opacity: state.pressed ? 0.82 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    minHeight: 72,
    padding: 16,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  description: {},
  label: {
    fontWeight: '700',
  },
  value: {
    fontWeight: '800',
  },
});
