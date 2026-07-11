import { type ReactNode, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { SectionHeader } from '@shared/components';
import { AnimatedCard } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

type SettingsSectionProps = {
  children: ReactNode;
  subtitle?: string;
  title: string;
};

export const SettingsSection = memo(function SettingsSection({
  children,
  subtitle,
  title,
}: SettingsSectionProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.wrapper}>
      <SectionHeader subtitle={subtitle} title={title} />
      <AnimatedCard
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        {children}
      </AnimatedCard>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  wrapper: {
    gap: 12,
  },
});
