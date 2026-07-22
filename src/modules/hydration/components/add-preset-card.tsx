import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

import { MaterialCommunityIcon } from '@shared/components';
import { AnimatedPressableScale } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

type AddPresetCardProps = {
  onPress: () => void;
};

export const AddPresetCard = memo(function AddPresetCard({ onPress }: AddPresetCardProps) {
  const theme = useTheme<AppTheme>();

  return (
    <AnimatedPressableScale
      accessibilityLabel="Manage quick add presets"
      accessibilityRole="button"
      onLongPress={onPress}
      onPress={onPress}
      pressedScale={0.975}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
          opacity: pressed ? 0.76 : 1,
        },
      ]}
    >
      <MaterialCommunityIcon color={theme.app.colors.hydrationProgress} name="plus" size={24} />
      <Text
        style={[
          styles.label,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        Add
      </Text>
    </AnimatedPressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
    justifyContent: 'center',
    marginRight: 10,
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 96,
  },
  label: {
    fontWeight: '800',
  },
});
