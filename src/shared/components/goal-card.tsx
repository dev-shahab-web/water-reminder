import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type GoalCardProps = {
  amountMl: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function GoalCard({
  amountMl,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: GoalCardProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View
      accessibilityLabel={`Daily goal ${amountMl} milliliters`}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.lg,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.label,
            lineHeight: theme.app.typography.lineHeight.label,
          },
        ]}
      >
        Daily goal
      </Text>
      <View style={styles.row}>
        <StepButton
          accessibilityLabel="Decrease daily goal"
          disabled={!canDecrease}
          label="-"
          onPress={onDecrease}
        />
        <View style={styles.amountWrap}>
          <Text
            style={[
              styles.amount,
              {
                color: theme.app.colors.textPrimary,
                fontFamily: theme.app.typography.fontFamily.display,
                fontSize: theme.app.typography.fontSize.display,
                lineHeight: theme.app.typography.lineHeight.display,
              },
            ]}
          >
            {amountMl}
          </Text>
          <Text
            style={[
              styles.unit,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.body,
                lineHeight: theme.app.typography.lineHeight.body,
              },
            ]}
          >
            ml per day
          </Text>
        </View>
        <StepButton
          accessibilityLabel="Increase daily goal"
          disabled={!canIncrease}
          label="+"
          onPress={onIncrease}
        />
      </View>
    </View>
  );
}

type StepButtonProps = {
  accessibilityLabel: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
};

function StepButton({ accessibilityLabel, disabled, label, onPress }: StepButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        {
          backgroundColor: theme.app.colors.surfaceSubtle,
          borderRadius: theme.app.radius.full,
          opacity: disabled ? 0.42 : pressed ? 0.72 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.stepButtonLabel,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.title,
            lineHeight: theme.app.typography.lineHeight.title,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontWeight: '800',
    textAlign: 'center',
  },
  amountWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  card: {
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stepButton: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  stepButtonLabel: {
    fontWeight: '700',
  },
  unit: {
    textAlign: 'center',
  },
});
