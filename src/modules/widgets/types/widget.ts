import type { MeasurementUnit, ThemePreference } from '@modules/settings/types';

export type HydrationWidgetState = {
  actionNonce: string;
  completionPercentage: number;
  consumedMl: number;
  currentStreak: number;
  goalCompleted: boolean;
  goalMl: number;
  measurementUnit: MeasurementUnit;
  nextReminderAt: number | null;
  onboardingCompleted: boolean;
  remainingMl: number;
  themePreference: ThemePreference;
  updatedAt: number;
};

export type WidgetRefreshReason =
  | 'app_active'
  | 'bootstrap'
  | 'database_import'
  | 'goal_changed'
  | 'health_connect_sync'
  | 'history_reset'
  | 'hydration_changed'
  | 'reminder_changed'
  | 'settings_changed'
  | 'widget_event'
  | 'widget_manual_refresh';
