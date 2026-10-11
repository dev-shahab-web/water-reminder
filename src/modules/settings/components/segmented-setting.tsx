import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

import { GlassPressable } from '@shared/components/glass-surface';
import type { AppTheme } from '@shared/theme';

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedSettingProps<T extends string> = {
  accessibilityLabel: string;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  value: T;
};

export function SegmentedSetting<T extends string>({
  accessibilityLabel,
  onChange,
  options,
  value,
}: SegmentedSettingProps<T>) {
  const theme = useTheme<AppTheme>();
  const { fontScale } = useWindowDimensions();

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <GlassPressable
            key={option.value}
            tone="inset"
            selected={selected}
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.option,
              {
                borderRadius: theme.app.radius.md,
                flexBasis: 80 * fontScale,
                minWidth: 72 * fontScale,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: theme.app.colors.textPrimary,
                  fontSize: theme.app.typography.fontSize.caption,
                  lineHeight: theme.app.typography.lineHeight.caption,
                },
              ]}
            >
              {option.label}
            </Text>
          </GlassPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  option: {
    alignItems: 'center',
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minWidth: 0,
    width: '100%',
  },
});
