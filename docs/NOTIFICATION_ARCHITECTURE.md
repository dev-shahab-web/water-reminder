# Notification Architecture

## Purpose

Notifications are platform capabilities exposed through a stable app service layer.

## Rules

- Feature modules do not call Expo Notifications directly.
- Permission requests are centralized.
- Scheduling and cancellation use typed platform APIs.
- Notification payloads must be versioned or structured enough for safe deep linking.
- Notification handlers should delegate to navigation or feature services without embedding business logic.

## Responsibilities

Platform notifications own:

- Permission status
- Permission prompts
- Scheduling
- Cancellation
- Notification listeners
- Payload normalization

Modules own:

- Deciding when a domain event requires notification scheduling
- Providing schedule data through repository/service APIs

## Reminder Notification Infrastructure

Reminder notifications use the following platform contracts:

- `src/platform/notifications/notification-actions.ts`
- `src/platform/notifications/notification-channels.ts`
- `src/platform/notifications/notification-service.ts`
- `src/modules/reminders/services/reminder-notification-factory.ts`

Android channels:

- `hydration-gentle-v1`: quiet, silent, low-disruption reminders.
- `hydration-active-v1`: system-default notification sound, vibration, default importance.
- `hydration-snooze-v1`: quiet one-off snoozed reminders.

Android users may override channel behavior in system settings. The app must not claim it can force sound, vibration, or visibility after a user changes OS-level channel preferences.

Notification category:

- `water_reminder.hydration_reminder.v1`

Action identifiers:

- `water_reminder.reminder.drink`
- `water_reminder.reminder.snooze`
- `water_reminder.reminder.dismiss`

Action identifiers are not user-facing copy and must remain stable for native callbacks and idempotency.

## Metadata Contract

Reminder notification data:

```ts
type ReminderNotificationData = {
  type: 'hydration_reminder';
  schemaVersion: 1;
  occurrenceId?: string;
  source: 'scheduled' | 'snoozed';
};
```

Rules:

- Treat notification data as untrusted runtime input.
- Parse with the reminder metadata guard before handling.
- Do not store hydration amounts, goals, reminder times, schedules, Health Connect identifiers, user identifiers, or telemetry-sensitive values in notification payloads.

## Action Lifecycle

Regular notification tap:

```txt
Expo notification response
-> AppShell
-> Home
-> reminderPulse
```

Drink action:

```txt
Expo notification response
-> reminder action service
-> idempotency check by occurrenceId
-> existing hydration log thunk
-> SQLite write
-> Redux update
-> widget refresh
-> Health Connect best-effort queue
-> reload today's entries
-> reconcile reminder schedule
-> dismiss handled notification
-> Home
```

Snooze action:

```txt
Expo notification response
-> reminder action service
-> snooze manager
-> cancel previous pending snooze
-> schedule one one-off snoozed reminder
-> persist pending snooze id
-> dismiss handled notification
```

Dismiss action:

```txt
Expo notification response
-> dismiss handled notification
-> no hydration log
-> no schedule mutation
```

## Android Limitations

- Expo notification actions are handled by JavaScript when Expo delivers a notification response.
- Actions that do not foreground the app are not guaranteed to trigger JavaScript if the app process is killed.
- Local notifications can be delayed by Doze mode, battery optimization, OEM restrictions, reboot behavior, and notification-channel overrides.
- Water Reminder must never bypass Do Not Disturb or use alarm semantics.

## Future Considerations

Notification architecture must support reminders, medicine schedules, habits, and other recurring workflows.

Persistent reminder mode is intentionally future-only. It must not be exposed until product review confirms it can remain calm, non-coercive, and respectful of Android notification policy.
