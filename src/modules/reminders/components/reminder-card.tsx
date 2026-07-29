import { memo, type ReactNode, useCallback, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';

import {
  MaterialCommunityIcon,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@shared/components';
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
const sleepOptions = ['20:00', '21:00', '22:00', '23:00', '00:00'] as const;
const activeHourOptions = [...wakeOptions, ...sleepOptions] as const;
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
  onNotificationSoundPress?: () => void | Promise<void>;
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
  onNotificationSoundPress,
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
        label={enabled ? 'Turn reminders off' : 'Enable reminders'}
        onPress={onToggleEnabled}
      />

      {enabled ? (
        <>
          <ControlGroup label="Active hours">
            <SegmentedOptionsGrid
              currentValue={wakeTime}
              labelPrefix="Wake time"
              onChange={onWakeTimeChange}
              onSecondaryChange={onSleepTimeChange}
              options={activeHourOptions}
              optionTypeByValue={{
                '07:00': 'wake',
                '08:00': 'wake',
                '09:00': 'wake',
                '10:00': 'wake',
                '20:00': 'sleep',
                '21:00': 'sleep',
                '22:00': 'sleep',
                '23:00': 'sleep',
                '00:00': 'sleep',
              }}
              secondaryCurrentValue={sleepTime}
              columns={4}
            />
          </ControlGroup>

          <ControlGroup label="Reminder rhythm">
            <SegmentedOptionsGrid
              currentValue={String(intervalMinutes)}
              labelPrefix="Reminder interval"
              onChange={(value) => {
                onIntervalChange(Number(value) as ReminderIntervalMinutes);
              }}
              options={intervalOptions.map(String)}
              suffix="min"
              columns={5}
            />
          </ControlGroup>

          <ControlGroup label="Reminder experience">
            <ModeOptions currentValue={mode} onChange={onModeChange} />
            <PreferenceSwitch
              label="Vibration"
              subtitle="Adds a short pulse for noticeable reminders."
              onChange={onVibrationChange}
              value={vibrationEnabled}
            />
            <PreferenceSwitch
              label="Enable snooze"
              subtitle={`Lets reminder actions pause the next nudge for ${defaultSnoozeMinutes} minutes.`}
              onChange={onSnoozeEnabledChange}
              value={snoozeEnabled}
            />
            {snoozeEnabled ? (
              <SegmentedOptionsGrid
                currentValue={String(defaultSnoozeMinutes)}
                labelPrefix="Default snooze"
                onChange={(value) => {
                  onDefaultSnoozeChange(Number(value) as ReminderSnoozeMinutes);
                }}
                options={snoozeOptions.map(String)}
                suffix="min"
                columns={5}
              />
            ) : null}
            <SoundPreferenceRow mode={mode} onPress={onNotificationSoundPress} />
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
          style={styles.optionButtonFull}
        />
      ))}
    </View>
  );
}

function PreferenceSwitch({
  label,
  onChange,
  subtitle,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  subtitle: string;
  value: boolean;
}) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceText}>
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
        <Text
          style={[
            styles.preferenceSubtitle,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <Switch accessibilityLabel={label} onValueChange={onChange} value={value} />
    </View>
  );
}

function SoundPreferenceRow({
  mode,
  onPress,
}: {
  mode: ReminderMode;
  onPress?: () => void | Promise<void>;
}) {
  const theme = useTheme<AppTheme>();
  const isActiveMode = mode === 'active';
  const isAndroid = Platform.OS === 'android';
  const isInteractive = isActiveMode && isAndroid && onPress !== undefined;
  const value = isActiveMode ? 'System default' : 'Silent';
  const supportingText = getSoundSupportingText({ isActiveMode, isAndroid });

  const content = (
    <>
      <View style={styles.preferenceText}>
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
          Notification sound
        </Text>
        <Text
          style={[
            styles.preferenceSubtitle,
            {
              color: theme.app.colors.textSecondary,
              fontSize: theme.app.typography.fontSize.caption,
              lineHeight: theme.app.typography.lineHeight.caption,
            },
          ]}
        >
          {supportingText}
        </Text>
      </View>
      <View style={styles.soundValueGroup}>
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
          {value}
        </Text>
        {isInteractive ? (
          <MaterialCommunityIcon
            color={theme.app.colors.textSecondary}
            name="chevron-right"
            size={20}
            testID="notification-sound-chevron"
          />
        ) : null}
      </View>
    </>
  );

  if (!isInteractive) {
    return (
      <View
        accessibilityHint={supportingText}
        accessibilityLabel={`Notification sound. ${value}`}
        style={[
          styles.soundRow,
          {
            backgroundColor: theme.app.colors.surfaceSubtle,
            borderColor: theme.app.colors.borderSubtle,
            borderRadius: theme.app.radius.md,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressableScale
      accessibilityHint={supportingText}
      accessibilityLabel={`Notification sound. ${value}`}
      accessibilityRole="button"
      onPress={() => {
        void onPress();
      }}
      pressedScale={0.98}
      style={({ pressed }) => [
        styles.soundRow,
        {
          backgroundColor: theme.app.colors.surfaceSubtle,
          borderColor: theme.app.colors.borderSubtle,
          borderRadius: theme.app.radius.md,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      {content}
    </AnimatedPressableScale>
  );
}

const getSoundSupportingText = ({
  isActiveMode,
  isAndroid,
}: {
  isActiveMode: boolean;
  isAndroid: boolean;
}): string => {
  if (!isActiveMode) {
    return 'Gentle reminders do not play a sound.';
  }

  if (!isAndroid) {
    return 'Notification sound is managed by Android notification channels.';
  }

  return 'Change the tone in Android notification settings.';
};

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
  columns: number;
  currentValue: string;
  labelPrefix: string;
  onChange: (value: string) => void;
  onSecondaryChange?: (value: string) => void;
  options: readonly string[];
  optionTypeByValue?: Record<string, 'sleep' | 'wake'>;
  secondaryCurrentValue?: string;
  suffix?: string;
};

function SegmentedOptionsGrid({
  columns,
  currentValue,
  labelPrefix,
  onChange,
  onSecondaryChange,
  options,
  optionTypeByValue,
  secondaryCurrentValue,
  suffix,
}: SegmentedOptionsProps) {
  const [rowWidth, setRowWidth] = useState(0);
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);

    setRowWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);
  const gap = 8;
  const optionWidth =
    rowWidth > 0 ? Math.floor((rowWidth - gap * (columns - 1)) / columns) : undefined;

  return (
    <View onLayout={handleLayout} style={[styles.optionGrid, { gap }]}>
      {options.map((option) => {
        const optionType = optionTypeByValue?.[option];
        const isSecondaryOption = optionType === 'sleep';
        const optionLabelPrefix = isSecondaryOption ? 'Sleep time' : labelPrefix;
        const selected = isSecondaryOption
          ? option === secondaryCurrentValue
          : option === currentValue;

        return (
          <OptionButton
            key={option}
            label={suffix === undefined ? option : `${option} ${suffix}`}
            selected={selected}
            accessibilityLabel={`${optionLabelPrefix} ${option}${
              suffix === undefined ? '' : ` ${suffix}`
            }`}
            onPress={() => {
              if (isSecondaryOption && onSecondaryChange !== undefined) {
                onSecondaryChange(option);
                return;
              }

              onChange(option);
            }}
            style={optionWidth === undefined ? styles.optionButtonFallback : { width: optionWidth }}
          />
        );
      })}
    </View>
  );
}

type OptionButtonProps = {
  accessibilityLabel: string;
  description?: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
};

function OptionButton({
  accessibilityLabel,
  description,
  label,
  onPress,
  selected,
  style,
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
        style,
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.25}
        numberOfLines={1}
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
    alignItems: 'center',
    borderWidth: 1,
    flexShrink: 0,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 9,
  },
  optionButtonFallback: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  optionButtonFull: {
    width: '100%',
  },
  optionDescription: {
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  optionText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  pauseButton: {
    flexBasis: 96,
    flexGrow: 1,
  },
  permissionMessage: {},
  preferenceLabel: {
    fontWeight: '700',
  },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 56,
  },
  preferenceSubtitle: {
    marginTop: 2,
  },
  preferenceText: {
    flex: 1,
    minWidth: 0,
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
  soundRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  soundValueGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
});
