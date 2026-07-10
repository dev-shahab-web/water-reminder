import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

import type { ReminderIntervalMinutes, ReminderPauseOption, ReminderStatus } from '../types';

const intervalOptions: ReminderIntervalMinutes[] = [30, 60, 90, 120, 180];
const wakeOptions = ['07:00', '08:00', '09:00', '10:00'] as const;
const sleepOptions = ['20:00', '21:00', '22:00', '23:00'] as const;
const pauseOptions: { label: string; value: ReminderPauseOption }[] = [
  { label: '30 min', value: '30min' },
  { label: '1 hour', value: '1hour' },
  { label: 'Today', value: 'today' },
];

type ReminderCardProps = {
  enabled: boolean;
  intervalMinutes: ReminderIntervalMinutes;
  onPause: (option: ReminderPauseOption) => void;
  onResume: () => void;
  onSleepTimeChange: (time: string) => void;
  onToggleEnabled: () => void;
  onWakeTimeChange: (time: string) => void;
  onIntervalChange: (interval: ReminderIntervalMinutes) => void;
  permissionMessage?: string;
  preview: string;
  sleepTime: string;
  status: ReminderStatus;
  summary: string;
  wakeTime: string;
};

export const ReminderCard = memo(function ReminderCard({
  enabled,
  intervalMinutes,
  onIntervalChange,
  onPause,
  onResume,
  onSleepTimeChange,
  onToggleEnabled,
  onWakeTimeChange,
  permissionMessage,
  preview,
  sleepTime,
  status,
  summary,
  wakeTime,
}: ReminderCardProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View
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
        <SectionHeader
          subtitle={enabled ? summary : 'Manual tracking remains fully available.'}
          title="Gentle reminders"
        />
        <StatusBadge status={status} />
      </View>

      <Text
        accessibilityLiveRegion="polite"
        style={[
          styles.preview,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        {preview}
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

      <PrimaryButton
        label={enabled ? 'Turn reminders off' : 'Turn reminders on'}
        onPress={onToggleEnabled}
      />

      {enabled ? (
        <>
          <ControlGroup label="Active hours">
            <SegmentedOptions
              currentValue={wakeTime}
              labelPrefix="Wake time"
              onChange={onWakeTimeChange}
              options={wakeOptions}
            />
            <SegmentedOptions
              currentValue={sleepTime}
              labelPrefix="Sleep time"
              onChange={onSleepTimeChange}
              options={sleepOptions}
            />
          </ControlGroup>

          <ControlGroup label="Reminder rhythm">
            <SegmentedOptions
              currentValue={String(intervalMinutes)}
              labelPrefix="Reminder interval"
              onChange={(value) => {
                onIntervalChange(Number(value) as ReminderIntervalMinutes);
              }}
              options={intervalOptions.map(String)}
              suffix="min"
            />
          </ControlGroup>

          <ControlGroup label="Pause">
            <View style={styles.optionRow}>
              {status === 'paused' ? (
                <SecondaryButton label="Resume reminders" onPress={onResume} />
              ) : (
                pauseOptions.map((option) => (
                  <SecondaryButton
                    key={option.value}
                    accessibilityLabel={`Pause reminders for ${option.label}`}
                    label={option.label}
                    onPress={() => {
                      onPause(option.value);
                    }}
                    style={styles.pauseButton}
                  />
                ))
              )}
            </View>
          </ControlGroup>
        </>
      ) : null}
    </View>
  );
});

type ControlGroupProps = {
  children: ReactNode;
  label: string;
};

function ControlGroup({ children, label }: ControlGroupProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.controlGroup}>
      <Text
        style={[
          styles.controlLabel,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

type SegmentedOptionsProps = {
  currentValue: string;
  labelPrefix: string;
  onChange: (value: string) => void;
  options: readonly string[];
  suffix?: string;
};

function SegmentedOptions({
  currentValue,
  labelPrefix,
  onChange,
  options,
  suffix,
}: SegmentedOptionsProps) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => (
        <OptionButton
          key={option}
          label={suffix === undefined ? option : `${option} ${suffix}`}
          selected={option === currentValue}
          accessibilityLabel={`${labelPrefix} ${option}${suffix === undefined ? '' : ` ${suffix}`}`}
          onPress={() => {
            onChange(option);
          }}
        />
      ))}
    </View>
  );
}

type OptionButtonProps = {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
  selected: boolean;
};

function OptionButton({ accessibilityLabel, label, onPress, selected }: OptionButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionButton,
        {
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : theme.app.colors.surfaceSubtle,
          borderColor: selected ? theme.colors.primary : theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
          opacity: pressed ? 0.74 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: ReminderStatus }) {
  const theme = useTheme<AppTheme>();
  const labelByStatus: Record<ReminderStatus, string> = {
    active: 'Active',
    blocked: 'Blocked',
    complete: 'Quiet',
    disabled: 'Off',
    paused: 'Paused',
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.app.colors.surfaceSubtle,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.full,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {labelByStatus[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  controlGroup: {
    gap: 8,
  },
  controlLabel: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  header: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionText: {
    fontWeight: '700',
  },
  pauseButton: {
    flexBasis: 96,
    flexGrow: 1,
  },
  permissionMessage: {},
  preview: {},
});
