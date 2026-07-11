import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { PrimaryButton } from '@shared/components/primary-button';
import type { AppTheme } from '@shared/theme';

import { AnimatedCard } from './animated-card';

type EmptyStateProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
  variant?: 'chart' | 'glass' | 'history' | 'reminder';
};

export const EmptyState = memo(function EmptyState({
  actionLabel,
  message,
  onAction,
  title,
  variant = 'glass',
}: EmptyStateProps) {
  const theme = useTheme<AppTheme>();

  return (
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
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.illustration,
          {
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.lg,
          },
        ]}
      >
        <EmptyGlyph variant={variant} />
      </View>
      <Text
        accessibilityRole="header"
        style={[
          styles.title,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.subtitle,
            lineHeight: theme.app.typography.lineHeight.subtitle,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        {message}
      </Text>
      {actionLabel === undefined || onAction === undefined ? null : (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </AnimatedCard>
  );
});

function EmptyGlyph({ variant }: { variant: NonNullable<EmptyStateProps['variant']> }) {
  const theme = useTheme<AppTheme>();

  if (variant === 'chart') {
    return (
      <View style={styles.chartGlyph}>
        {[18, 32, 24].map((height) => (
          <View
            key={height}
            style={[
              styles.chartBar,
              {
                backgroundColor: theme.app.colors.hydrationProgress,
                borderRadius: theme.app.radius.sm,
                height,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (variant === 'history') {
    return (
      <View
        style={[
          styles.calendarGlyph,
          {
            borderColor: theme.app.colors.hydrationProgress,
            borderRadius: theme.app.radius.sm,
          },
        ]}
      />
    );
  }

  if (variant === 'reminder') {
    return (
      <View
        style={[
          styles.reminderGlyph,
          {
            borderColor: theme.app.colors.hydrationProgress,
            borderRadius: theme.app.radius.full,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.dropGlyph,
        {
          backgroundColor: theme.app.colors.hydrationProgress,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          borderTopLeftRadius: 24,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  action: {
    alignSelf: 'stretch',
  },
  calendarGlyph: {
    borderWidth: 3,
    height: 38,
    width: 34,
  },
  card: {
    alignItems: 'center',
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  chartBar: {
    width: 10,
  },
  chartGlyph: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 5,
  },
  dropGlyph: {
    height: 42,
    transform: [{ rotate: '45deg' }],
    width: 30,
  },
  illustration: {
    alignItems: 'center',
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  message: {
    textAlign: 'center',
  },
  reminderGlyph: {
    borderWidth: 3,
    height: 38,
    width: 38,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
