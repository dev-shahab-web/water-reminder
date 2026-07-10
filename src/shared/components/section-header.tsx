import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import type { AppTheme } from '@shared/theme';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, subtitle, title }: SectionHeaderProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.container}>
      {eyebrow === undefined ? null : (
        <Text
          style={[
            styles.eyebrow,
            {
              color: theme.app.colors.hydrationProgress,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {eyebrow}
        </Text>
      )}
      <Text
        accessibilityRole="header"
        style={[
          styles.title,
          {
            color: theme.app.colors.textPrimary,
            fontFamily: theme.app.typography.fontFamily.display,
            fontSize: theme.app.typography.fontSize.title,
            lineHeight: theme.app.typography.lineHeight.title,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle === undefined ? null : (
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.body,
              lineHeight: theme.app.typography.lineHeight.body,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  eyebrow: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  subtitle: {},
  title: {
    fontWeight: '800',
  },
});
