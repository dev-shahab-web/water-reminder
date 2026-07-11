import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { AnimatedPressableScale } from '@shared/motion';
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

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <AnimatedPressableScale
            key={option.value}
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(option.value);
            }}
            pressedScale={0.97}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected
                  ? theme.colors.primaryContainer
                  : theme.app.colors.surfaceSubtle,
                borderColor: selected ? theme.colors.primary : theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.md,
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
          </AnimatedPressableScale>
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
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
