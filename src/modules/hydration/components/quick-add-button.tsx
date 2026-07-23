import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { MeasurementUnit } from '@modules/settings';
import {
  getMeasurementUnitLabel,
  getMeasurementValue,
} from '@modules/settings/utils/settings-options';
import { MaterialCommunityIcon } from '@shared/components';
import { AnimatedPressableScale } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

export type QuickAddCardVariant = { amountMl: number; type: 'preset' } | { type: 'add' };

type QuickAddButtonProps = {
  disabled?: boolean;
  measurementUnit: MeasurementUnit;
  onPress: () => void;
  variant: QuickAddCardVariant;
};

export const QuickAddButton = memo(function QuickAddButton({
  disabled = false,
  measurementUnit,
  onPress,
  variant,
}: QuickAddButtonProps) {
  const theme = useTheme<AppTheme>();
  const isAddCard = variant.type === 'add';
  const amountLabel =
    variant.type === 'preset' ? getMeasurementValue(variant.amountMl, measurementUnit) : undefined;
  const unitLabel = getMeasurementUnitLabel(measurementUnit);

  return (
    <AnimatedPressableScale
      accessibilityLabel={
        variant.type === 'preset'
          ? `Add ${amountLabel} ${unitLabel} of water`
          : 'Manage quick add presets'
      }
      accessibilityRole="button"
      disabled={disabled}
      onLongPress={isAddCard ? onPress : undefined}
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
        <MaterialCommunityIcon
          color={theme.app.colors.hydrationProgress}
          name={isAddCard ? 'plus' : 'water'}
          size={isAddCard ? 26 : 18}
        />
        {variant.type === 'preset' ? (
          <>
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
              {amountLabel}
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
              {unitLabel}
            </Text>
          </>
        ) : (
          <Text
            style={[
              styles.addLabel,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.body,
                lineHeight: theme.app.typography.lineHeight.body,
              },
            ]}
          >
            Add
          </Text>
        )}
      </View>
    </AnimatedPressableScale>
  );
});

const styles = StyleSheet.create({
  amount: {
    fontWeight: '800',
  },
  addLabel: {
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 10,
    height: 80,
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 14,
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
