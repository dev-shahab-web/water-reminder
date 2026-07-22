import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { MaterialCommunityIcon, PrimaryButton, SecondaryButton } from '@shared/components';
import { AnimatedCard } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

import type { ReminderMode, ReminderPauseOption, ReminderStatus } from '../types';

type CompactReminderCardProps = {
  enabled: boolean;
  mode: ReminderMode;
  onOpenSettings: () => void;
  onPause: (option: ReminderPauseOption) => void;
  onResume: () => void;
  onToggleEnabled: () => void;
  permissionMessage?: string;
  preview: string;
  status: ReminderStatus;
  summary: string;
};

export const CompactReminderCard = memo(function CompactReminderCard({
  enabled,
  mode,
  onOpenSettings,
  onPause,
  onResume,
  onToggleEnabled,
  permissionMessage,
  preview,
  status,
  summary,
}: CompactReminderCardProps) {
  const theme = useTheme<AppTheme>();
  const copy = getReminderCopy({ enabled, mode, preview, status, summary });

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
      <View style={styles.header}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.iconShell,
            {
              backgroundColor: theme.app.colors.surfaceSubtle,
              borderColor: theme.app.colors.borderSubtle,
              borderRadius: theme.app.radius.full,
            },
          ]}
        >
          <MaterialCommunityIcon
            color={theme.app.colors.hydrationProgress}
            name={copy.icon}
            size={22}
          />
        </View>
        <View style={styles.copy}>
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
            {copy.title}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.subtitle,
              {
                color: theme.app.colors.textSecondary,
                fontSize: theme.app.typography.fontSize.caption,
                lineHeight: theme.app.typography.lineHeight.caption,
              },
            ]}
          >
            {copy.subtitle}
          </Text>
        </View>
        <Text
          style={[
            styles.badge,
            {
              backgroundColor: theme.app.colors.surfaceSubtle,
              borderColor: theme.app.colors.borderSubtle,
              borderRadius: theme.app.radius.full,
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {copy.badge}
        </Text>
      </View>

      <Text
        style={[
          styles.preview,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        {copy.supportingLine}
      </Text>

      {permissionMessage === undefined ? null : (
        <Text
          accessibilityRole="alert"
          style={[
            styles.permissionMessage,
            {
              color: theme.app.colors.statusWarning,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {permissionMessage}
        </Text>
      )}

      <View style={styles.actions}>
        {status === 'paused' ? (
          <PrimaryButton
            accessibilityLabel="Resume hydration reminders"
            icon="play"
            label="Resume"
            onPress={onResume}
            style={styles.actionButton}
          />
        ) : null}
        {status === 'disabled' || status === 'blocked' ? (
          <PrimaryButton
            accessibilityLabel="Enable hydration reminders"
            icon="bell-outline"
            label="Enable reminders"
            onPress={onToggleEnabled}
            style={styles.actionButton}
          />
        ) : null}
        {status === 'active' ? (
          <>
            <SecondaryButton
              accessibilityLabel="Pause reminders for 30 minutes"
              icon="pause"
              label="30 min"
              onPress={() => {
                onPause('30min');
              }}
              style={styles.actionButton}
            />
            <SecondaryButton
              accessibilityLabel="Pause reminders for 1 hour"
              icon="pause"
              label="1 hour"
              onPress={() => {
                onPause('1hour');
              }}
              style={styles.actionButton}
            />
          </>
        ) : null}
        <SecondaryButton
          accessibilityLabel="Open reminder settings"
          icon="cog-outline"
          label="Settings"
          onPress={onOpenSettings}
          style={styles.actionButton}
        />
      </View>
    </AnimatedCard>
  );
});

const getReminderCopy = ({
  enabled,
  mode,
  preview,
  status,
  summary,
}: {
  enabled: boolean;
  mode: ReminderMode;
  preview: string;
  status: ReminderStatus;
  summary: string;
}) => {
  if (status === 'blocked') {
    return {
      badge: 'Blocked',
      icon: 'bell-alert-outline',
      subtitle: 'Notifications need Android permission.',
      supportingLine: 'Open reminder settings when you want gentle nudges again.',
      title: 'Notifications are blocked',
    };
  }

  if (status === 'paused') {
    return {
      badge: 'Paused',
      icon: 'pause-circle-outline',
      subtitle: preview,
      supportingLine: 'Water logging still works while reminders stay quiet.',
      title: 'Reminders paused',
    };
  }

  if (status === 'complete') {
    return {
      badge: 'Quiet',
      icon: 'check-circle-outline',
      subtitle: 'Done for today.',
      supportingLine: 'Nice work. Reminders are quiet until tomorrow.',
      title: 'Goal complete',
    };
  }

  if (!enabled) {
    return {
      badge: 'Off',
      icon: 'bell-off-outline',
      subtitle: 'Manual tracking remains available.',
      supportingLine: 'Turn reminders on when you want a gentle rhythm.',
      title: 'Reminders are off',
    };
  }

  return {
    badge: mode === 'active' ? 'Active' : 'Gentle',
    icon: mode === 'active' ? 'bell-ring-outline' : 'bell-outline',
    subtitle: summary,
    supportingLine: preview,
    title: 'Active reminders',
  };
};

const styles = StyleSheet.create({
  actionButton: {
    flexBasis: 124,
    flexGrow: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderWidth: 1,
    flexShrink: 0,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  iconShell: {
    alignItems: 'center',
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  permissionMessage: {},
  preview: {},
  subtitle: {},
  title: {
    fontWeight: '800',
  },
});
