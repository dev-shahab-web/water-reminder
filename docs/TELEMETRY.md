# Telemetry

## Purpose

Water Reminder uses Firebase only for privacy-safe diagnostics and minimal product health signals.

Enabled Firebase services:

- Firebase Analytics.
- Firebase Crashlytics.

Disabled / not used:

- Firebase Authentication.
- Firestore.
- Remote Config.
- Performance Monitoring.
- Cloud Messaging.
- Ads.
- Any backend user account service.

## Consent

Telemetry is controlled by the Settings toggle:

`Share anonymous diagnostics`

Default: off.

When disabled:

- Analytics collection is disabled.
- Crashlytics collection is disabled where supported.
- New telemetry events are not sent.
- Hydration logging, reminders, widgets, SQLite, Health Connect, history, and statistics continue working.

When enabled:

- Anonymous app usage events and crash diagnostics may be transmitted to Google Firebase.
- Hydration content and Health Connect records remain excluded.

## Event Allowlist

Allowed Analytics events:

- `app_open`
- `onboarding_completed`
- `screen_view`
- `hydration_log_action`
- `hydration_edit_action`
- `hydration_delete_action`
- `hydration_undo_action`
- `quick_add_used`
- `custom_amount_opened`
- `custom_amount_logged`
- `goal_completed`
- `history_opened`
- `statistics_opened`
- `settings_opened`
- `notification_clicked`
- `reminder_enabled`
- `reminder_disabled`
- `widget_action_used`
- `health_connect_connected`
- `health_connect_disconnected`
- `health_connect_sync_started`
- `health_connect_sync_completed`
- `health_connect_sync_failed`
- `export_started`
- `export_completed`
- `import_started`
- `import_completed`
- `theme_changed`
- `reduce_motion_changed`
- `feedback_opened`
- `privacy_policy_opened`
- `terms_opened`
- `rate_app_opened`

Allowed parameters:

- `source`: `app`, `widget`, `notification`
- `result`: `success`, `cancelled`, `failed`
- `screen_name`: stable route names only
- `theme`: `system`, `light`, `dark`
- `connected`: boolean

## Event Definitions

- `quick_add_used`: sent after a Home quick-add log succeeds. Parameters: `source: app`.
- `custom_amount_logged`: sent after a custom amount log succeeds. Parameters: `source: app`.
- `widget_action_used`: sent once after a native widget hydration action is reconciled into the app. Parameters: `source: widget`.
- `goal_completed`: sent only when today's progress transitions from below goal to completed. Parameters: `source`.
- `settings_opened`: sent when the user chooses the Settings navigation action, not when Settings rerenders. Parameters: `source: app`.
- `notification_clicked`: sent only after the user taps a reminder notification. Parameters: `source: notification`.
- `health_connect_connected`: sent after Health Connect permissions are granted and the local database is ready. Parameters: `connected: true`, `source: app`.
- `health_connect_disconnected`: sent after Health Connect disconnect succeeds. Parameters: `connected: false`, `source: app`.

These events must not include hydration values, totals, goals, percentages, entry ids, Health Connect record ids, timestamps, or reminder times.

## Prohibited Data

Telemetry must never include:

- Hydration amount.
- Daily total.
- Hydration goal.
- Entry timestamp.
- Hydration history.
- Health Connect values.
- Health Connect record ids.
- Reminder times or schedule.
- Exported or imported database contents.
- Email address.
- User-entered text.
- Database rows.
- Raw SQL.
- Filenames or file contents.
- Precise location.
- Account identity.
- Notification contents.

## Screen Tracking

Screen tracking uses stable Expo Router route names:

- `home`
- `onboarding`
- `history`
- `statistics`
- `settings`
- `health_connect`
- `privacy_policy`
- `terms`
- `licences`

Query params, entry ids, dates, database ids, and route parameters are not sent.

## Crashlytics

Crashlytics records:

- Native crashes through the SDK.
- Selected handled operational failures.
- Sanitized attributes only.

Allowed Crashlytics attributes:

- `app_version`
- `build_number`
- `route_name`
- `operation_name`
- `error_category`
- `source`
- `database_ready`
- `health_connect_available`
- `widget_available`

No user identifier is set. `setUserId` must not be used.

## Handled Errors

Allowed handled-error operations:

- `database_initialization_failed`
- `hydration_write_failed`
- `widget_refresh_failed`
- `health_connect_sync_failed`
- `reminder_schedule_failed`
- `import_failed`
- `export_failed`

Raw native, SQL, hydration, Health Connect, or user-entered details are converted into safe categories before reporting.

## Development Behavior

In development and tests:

- Tests mock Firebase modules.
- Normal telemetry calls are safe and non-blocking.
- Unsafe events or parameters throw in development.
- Unknown events are dropped safely in production.

## Firebase Configuration

Android Firebase config is referenced from:

```txt
google-services.json
```

This file is local/CI configuration and is ignored by git.

Manual Firebase Console tasks:

- Create the Android app with package `com.shahab.waterreminder`.
- Download `google-services.json`.
- Place it at the repository root for local builds.
- Configure Crashlytics and Analytics retention in Firebase Console.
- Use Analytics DebugView for event validation.
- Use a non-production crash test build for Crashlytics validation.
