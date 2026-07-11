import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { AnimatedCard } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

import type { StatisticsInsight } from '../types/statistics';

type InsightListProps = {
  insights: readonly StatisticsInsight[];
};

export function InsightList({ insights }: InsightListProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.list}>
      {insights.map((insight, index) => (
        <AnimatedCard
          key={`${insight.title}-${insight.detail}`}
          delay={Math.min(index * 34, 180)}
          style={[
            styles.item,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.app.colors.borderSubtle,
              borderRadius: theme.app.radius.md,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                color: theme.app.colors.textPrimary,
                fontSize: theme.app.typography.fontSize.body,
                lineHeight: theme.app.typography.lineHeight.body,
              },
            ]}
          >
            {insight.title}
          </Text>
          <Text
            style={[
              styles.detail,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.caption,
                lineHeight: theme.app.typography.lineHeight.caption,
              },
            ]}
          >
            {insight.detail}
          </Text>
        </AnimatedCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  detail: {},
  item: {
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  list: {
    gap: 10,
  },
  title: {
    fontWeight: '800',
  },
});
