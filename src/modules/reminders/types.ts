export const REMINDER_INTERVAL_OPTIONS = [30, 60, 90, 120, 180] as const;
export const REMINDER_PAUSE_OPTIONS = ['30min', '1hour', 'today'] as const;

export type ReminderIntervalMinutes = (typeof REMINDER_INTERVAL_OPTIONS)[number];
export type ReminderPauseOption = (typeof REMINDER_PAUSE_OPTIONS)[number];

export type ReminderPreferences = {
  enabled: boolean;
  intervalMinutes: ReminderIntervalMinutes;
  pausedUntilIso?: string;
  scheduledNotificationIds: string[];
  sleepTime: string;
  timezone: string;
  wakeTime: string;
};

export type ReminderScheduleInput = {
  goalAmount: number;
  now: Date;
  preferences: ReminderPreferences;
  totalAmount: number;
};

export type ReminderScheduleItem = {
  body: string;
  date: Date;
  title: string;
};

export type ReminderStatus = 'active' | 'blocked' | 'disabled' | 'paused' | 'complete';
