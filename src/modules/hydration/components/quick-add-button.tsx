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
import { alternateGlassCapacity } from '../utils/glass-options';
import { GlassIllustration } from './glass-illustration';

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
      glass="regular"
      accessibilityLabel={
        variant.type === 'preset'
          ? `Add ${amountLabel} ${unitLabel} of water`
          : 'Choose glass sizes'
      }
      accessibilityRole="button"
      disabled={disabled}
      onLongPress={isAddCard ? onPress : undefined}
      onPress={onPress}
      pressedScale={0.975}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: theme.app.radius.md,

          opacity: disabled ? 0.48 : pressed ? 0.76 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {variant.type === 'preset' ? (
          <GlassIllustration amountMl={variant.amountMl} compact />
        ) : (
          <MaterialCommunityIcon color={theme.app.colors.hydrationProgress} name="plus" size={26} />
        )}
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
            <Text
              style={{
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.caption,
              }}
            >
              ≈ {alternateGlassCapacity(variant.amountMl, measurementUnit)}
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
            Glasses
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
    minHeight: 174,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minWidth: 106,
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
