export const telemetryEvents = [
  'app_open',
  'onboarding_completed',
  'screen_view',
  'hydration_log_action',
  'hydration_edit_action',
  'hydration_delete_action',
  'hydration_undo_action',
  'quick_add_used',
  'custom_amount_opened',
  'custom_amount_logged',
  'goal_completed',
  'history_opened',
  'statistics_opened',
  'settings_opened',
  'notification_clicked',
  'reminder_enabled',
  'reminder_disabled',
  'widget_action_used',
  'health_connect_connected',
  'health_connect_disconnected',
  'health_connect_sync_started',
  'health_connect_sync_completed',
  'health_connect_sync_failed',
  'export_started',
  'export_completed',
  'import_started',
  'import_completed',
  'theme_changed',
  'reduce_motion_changed',
  'feedback_opened',
  'privacy_policy_opened',
  'terms_opened',
  'rate_app_opened',
] as const;

export type TelemetryEventName = (typeof telemetryEvents)[number];

export type TelemetryParameterValue = boolean | string;

export type TelemetryParameters = Partial<{
  connected: boolean;
  result: 'cancelled' | 'failed' | 'success';
  screen_name: TelemetryScreenName;
  source: 'app' | 'notification' | 'widget';
  theme: 'dark' | 'light' | 'system';
}>;

export const telemetryScreens = [
  'home',
  'onboarding',
  'history',
  'statistics',
  'settings',
  'health_connect',
  'privacy_policy',
  'terms',
  'licences',
] as const;

export type TelemetryScreenName = (typeof telemetryScreens)[number];

export type HandledErrorOperation =
  | 'database_initialization_failed'
  | 'hydration_write_failed'
  | 'widget_refresh_failed'
  | 'health_connect_sync_failed'
  | 'reminder_schedule_failed'
  | 'import_failed'
  | 'export_failed';

export type HandledErrorContext = Partial<{
  database_ready: boolean;
  error_category: string;
  health_connect_available: boolean;
  operation_name: HandledErrorOperation;
  route_name: TelemetryScreenName;
  source: 'app' | 'notification' | 'widget';
  widget_available: boolean;
}>;
