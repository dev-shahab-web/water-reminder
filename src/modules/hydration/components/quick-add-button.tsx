import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { AnimatedPressableScale } from '@shared/motion';
import type { AppTheme } from '@shared/theme';
import type { MeasurementUnit } from '@modules/settings';
import {
  getMeasurementUnitLabel,
  getMeasurementValue,
} from '@modules/settings/utils/settings-options';

type QuickAddButtonProps = {
  amount: number;
  disabled?: boolean;
  measurementUnit: MeasurementUnit;
  onPress: () => void;
};

export const QuickAddButton = memo(function QuickAddButton({
  amount,
  disabled = false,
  measurementUnit,
  onPress,
}: QuickAddButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <AnimatedPressableScale
      accessibilityLabel={`Add ${getMeasurementValue(amount, measurementUnit)} ${getMeasurementUnitLabel(
        measurementUnit,
      )} of water`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.975}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
          elevation: disabled ? 0 : 1,
          opacity: disabled ? 0.48 : pressed ? 0.76 : 1,
          shadowColor: theme.app.colors.hydrationProgress,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon color={theme.app.colors.hydrationProgress} size={18} source="water" />
        <Text
          style={[
            styles.amount,
            {
              color: theme.app.colors.textPrimary,
              fontSize: theme.app.typography.fontSize.subtitle,
              lineHeight: theme.app.typography.lineHeight.subtitle,
            },
          ]}
        >
          {getMeasurementValue(amount, measurementUnit)}
        </Text>
        <Text
          style={[
            styles.unit,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {getMeasurementUnitLabel(measurementUnit)}
        </Text>
      </View>
    </AnimatedPressableScale>
  );
});

const styles = StyleSheet.create({
  amount: {
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 10,
    minHeight: 72,
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 96,
  },
  content: {
    alignItems: 'center',
    gap: 2,
  },
  unit: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
