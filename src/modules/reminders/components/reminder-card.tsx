import { memo, type ReactNode } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import { AnimatedCard, AnimatedPressableScale } from '@shared/motion';
import type { AppTheme } from '@shared/theme';

import type {
  ReminderIntervalMinutes,
  ReminderMode,
  ReminderPauseOption,
  ReminderSnoozeMinutes,
  ReminderStatus,
} from '../types';

const intervalOptions: ReminderIntervalMinutes[] = [30, 60, 90, 120, 180];
const modeOptions: { description: string; label: string; value: ReminderMode }[] = [
  {
    description: 'Quiet reminders that stay out of your way.',
    label: 'Gentle',
    value: 'gentle',
  },
  {
    description: 'Sound and vibration when you need a stronger nudge.',
    label: 'Active',
    value: 'active',
  },
];
const snoozeOptions: ReminderSnoozeMinutes[] = [5, 10, 15, 30, 60];
const wakeOptions = ['07:00', '08:00', '09:00', '10:00'] as const;
const sleepOptions = ['20:00', '21:00', '22:00', '23:00'] as const;
const pauseOptions: { label: string; value: ReminderPauseOption }[] = [
  { label: '30 min', value: '30min' },
  { label: '1 hour', value: '1hour' },
  { label: 'Today', value: 'today' },
];

type ReminderCardProps = {
  defaultSnoozeMinutes: ReminderSnoozeMinutes;
  enabled: boolean;
  intervalMinutes: ReminderIntervalMinutes;
  mode: ReminderMode;
  onDefaultSnoozeChange: (duration: ReminderSnoozeMinutes) => void;
  onPause: (option: ReminderPauseOption) => void;
  onResume: () => void;
  onSleepTimeChange: (time: string) => void;
  onSnoozeEnabledChange: (enabled: boolean) => void;
  onToggleEnabled: () => void;
  onWakeTimeChange: (time: string) => void;
  onIntervalChange: (interval: ReminderIntervalMinutes) => void;
  onModeChange: (mode: ReminderMode) => void;
  onVibrationChange: (enabled: boolean) => void;
  permissionMessage?: string;
  preview: string;
  sleepTime: string;
  snoozeEnabled: boolean;
  status: ReminderStatus;
  summary: string;
  vibrationEnabled: boolean;
  wakeTime: string;
};

export const ReminderCard = memo(function ReminderCard({
  defaultSnoozeMinutes,
  enabled,
  intervalMinutes,
  mode,
  onDefaultSnoozeChange,
  onIntervalChange,
  onModeChange,
  onPause,
  onResume,
  onSleepTimeChange,
  onSnoozeEnabledChange,
  onToggleEnabled,
  onVibrationChange,
  onWakeTimeChange,
  permissionMessage,
  preview,
  sleepTime,
  snoozeEnabled,
  status,
  summary,
  vibrationEnabled,
  wakeTime,
}: ReminderCardProps) {
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

      {enabled ? null : <ReminderOffState />}

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
        icon={enabled ? 'bell-off-outline' : 'bell-outline'}
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

          <ControlGroup label="Reminder experience">
            <ModeOptions currentValue={mode} onChange={onModeChange} />
            <PreferenceSwitch
              label="Vibration"
              onChange={onVibrationChange}
              value={vibrationEnabled}
            />
            <PreferenceSwitch
              label="Enable snooze"
              onChange={onSnoozeEnabledChange}
              value={snoozeEnabled}
            />
            {snoozeEnabled ? (
              <SegmentedOptions
                currentValue={String(defaultSnoozeMinutes)}
                labelPrefix="Default snooze"
                onChange={(value) => {
                  onDefaultSnoozeChange(Number(value) as ReminderSnoozeMinutes);
                }}
                options={snoozeOptions.map(String)}
                suffix="min"
              />
            ) : null}
            <SoundSummary mode={mode} />
          </ControlGroup>

          <ControlGroup label="Pause">
            <View style={styles.optionRow}>
              {status === 'paused' ? (
                <SecondaryButton icon="play" label="Resume reminders" onPress={onResume} />
              ) : (
                pauseOptions.map((option) => (
                  <SecondaryButton
                    key={option.value}
                    accessibilityLabel={`Pause reminders for ${option.label}`}
                    icon="pause"
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
    </AnimatedCard>
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

function ModeOptions({
  currentValue,
  onChange,
}: {
  currentValue: ReminderMode;
  onChange: (mode: ReminderMode) => void;
}) {
  return (
    <View style={styles.modeOptionList}>
      {modeOptions.map((option) => (
        <OptionButton
          key={option.value}
          description={option.description}
          label={option.label}
          selected={option.value === currentValue}
          accessibilityLabel={`Reminder style ${option.label}. ${option.description}`}
          onPress={() => {
            onChange(option.value);
          }}
        />
      ))}
    </View>
  );
}

function PreferenceSwitch({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.preferenceRow}>
      <Text
        style={[
          styles.preferenceLabel,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        {label}
      </Text>
      <Switch accessibilityLabel={label} onValueChange={onChange} value={value} />
    </View>
  );
}

function SoundSummary({ mode }: { mode: ReminderMode }) {
  const theme = useTheme<AppTheme>();
  const soundLabel = mode === 'active' ? 'System default' : 'Silent';

  return (
    <View style={styles.preferenceRow}>
      <Text
        style={[
          styles.preferenceLabel,
          {
            color: theme.app.colors.textPrimary,
            fontSize: theme.app.typography.fontSize.body,
            lineHeight: theme.app.typography.lineHeight.body,
          },
        ]}
      >
        Sound
      </Text>
      <Text
        style={[
          styles.soundValue,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        {soundLabel}
      </Text>
    </View>
  );
}

function ReminderOffState() {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.reminderOffState}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.reminderGlyph,
          {
            borderColor: theme.app.colors.hydrationProgress,
            borderRadius: theme.app.radius.full,
          },
        ]}
      />
      <Text
        style={[
          styles.reminderOffText,
          {
            color: theme.app.colors.textSecondary,
            fontSize: theme.app.typography.fontSize.caption,
            lineHeight: theme.app.typography.lineHeight.caption,
          },
        ]}
      >
        Reminders are quiet until you turn them on.
      </Text>
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
  description?: string;
  label: string;
  onPress: () => void;
  selected: boolean;
};

function OptionButton({
  accessibilityLabel,
  description,
  label,
  onPress,
  selected,
}: OptionButtonProps) {
  const theme = useTheme<AppTheme>();

  return (
    <AnimatedPressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      pressedScale={0.97}
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
      {description === undefined ? null : (
        <Text
          style={[
            styles.optionDescription,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {description}
        </Text>
      )}
    </AnimatedPressableScale>
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
  modeOptionList: {
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionDescription: {
    marginTop: 4,
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
  preferenceLabel: {
    flex: 1,
    fontWeight: '700',
  },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  preview: {},
  reminderGlyph: {
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  reminderOffState: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  reminderOffText: {
    flex: 1,
  },
  soundValue: {
    fontWeight: '700',
  },
});
