import type { HydrationReminderChannelId } from '@platform/notifications';

export const REMINDER_INTERVAL_OPTIONS = [30, 60, 90, 120, 180] as const;
export const REMINDER_PAUSE_OPTIONS = ['30min', '1hour', 'today'] as const;
export const REMINDER_MODES = ['gentle', 'active'] as const;
export const REMINDER_SNOOZE_OPTIONS = [5, 10, 15, 30, 60] as const;
export const REMINDER_SOUND_TYPES = ['silent', 'system_default', 'device_picker'] as const;
export const REMINDER_ACTIVATION_STATES = [
  'not_configured',
  'enabled',
  'disabled_by_user',
] as const;

export type ReminderActivationState = (typeof REMINDER_ACTIVATION_STATES)[number];
export type ReminderIntervalMinutes = (typeof REMINDER_INTERVAL_OPTIONS)[number];
export type ReminderPauseOption = (typeof REMINDER_PAUSE_OPTIONS)[number];
export type ReminderMode = (typeof REMINDER_MODES)[number];
export type ReminderSnoozeMinutes = (typeof REMINDER_SNOOZE_OPTIONS)[number];
export type ReminderSoundType = (typeof REMINDER_SOUND_TYPES)[number];

export type ReminderSoundPreference = {
  type: ReminderSoundType;
};

export type ReminderPreferences = {
  activationState: ReminderActivationState;
  activeModeDefaultsApplied: boolean;
  defaultSnoozeMinutes: ReminderSnoozeMinutes;
  enabled: boolean;
  intervalMinutes: ReminderIntervalMinutes;
  mode: ReminderMode;
  pausedUntilIso?: string;
  pendingSnoozeNotificationId?: string;
  pendingSnoozeTargetIso?: string;
  preferenceSchemaVersion: number;
  scheduledNotificationIds: string[];
  sleepTime: string;
  snoozeEnabled: boolean;
  sound: ReminderSoundPreference;
  timezone: string;
  vibrationEnabled: boolean;
  wakeTime: string;
};

export type ReminderScheduleInput = {
  goalAmount: number;
  now: Date;
  preferences: ReminderPreferences;
  totalAmount: number;
};

export type ReminderScheduleItem = {
  androidChannelId: HydrationReminderChannelId;
  body: string;
  categoryIdentifier?: string;
  data: Record<string, unknown>;
  date: Date;
  identifier: string;
  sound: false | 'default';
  title: string;
  vibrate?: number[];
};

export type ReminderStatus = 'active' | 'blocked' | 'disabled' | 'paused' | 'complete';
