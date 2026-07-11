import { StyleSheet, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

import { AnimatedCard } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  const theme = useTheme<AppTheme>();

  return (
    <AnimatedCard
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
        },
      ]}
    >
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
        {label}
      </Text>
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
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: 4,
    padding: 14,
  },
  label: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    fontWeight: '800',
  },
});
