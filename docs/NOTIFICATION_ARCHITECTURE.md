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

Android users may override channel behavior in system settings. The app preference represents what Water Reminder requests for future notification content; the Android channel state represents what the OS/user currently allows. The app must not claim it can force sound, vibration, or visibility after a user changes OS-level channel preferences.

Sound preferences:

- `silent`: schedules through the quiet reminder channel and sets content sound to `false`.
- `system_default`: schedules through the active reminder channel and sets content sound to `default`.
- Legacy `device_picker` values are treated as device-managed active-channel sound preferences. The app does not present an in-app tone picker.

Sound settings navigation:

- Gentle mode renders sound as `Silent` and does not open any settings.
- Active mode renders sound as `System default` and opens Android notification settings for `hydration-active-v1` where supported.
- The app initializes notification channels before opening settings so `hydration-active-v1` exists before Android displays channel controls.
- Fallback order is specific channel settings, app notification settings, generic app settings, then a non-blocking message if no settings destination opens.

The Test Notification action must use the same `ReminderNotificationFactory` and `scheduleLocalNotification` pipeline as real reminders. It may only differ by delivery time and `source: 'test'` metadata. Repeated test taps replace the previous pending test notification using the stable `hydration-reminder-test` identifier.

Schedule ownership:

- Base Gentle reminders use `hydration-gentle-v1` only.
- Base Active reminders use `hydration-active-v1` only.
- Snoozed reminders use `hydration-snooze-v1` only and never mutate the base schedule.
- Test reminders use the current effective mode channel and are never persisted as base scheduled IDs.
- No new real reminder should use Android's legacy `default` channel.

Schedule reconciliation:

- `reconcileReminderSchedule` serializes base schedule rebuilds.
- Reconciliation reads canonical reminder preferences before scheduling and aborts if the request was started from stale preference state.
- Reconciliation writes only schedule-owned fields back to UI state: scheduled ids, pending snooze ids, pending snooze target, and timezone.
- Before returning or rebuilding, it audits Expo's currently scheduled notifications, not only MMKV IDs.
- Hydration reminders are classified by structured metadata and the `hydration-reminder-` legacy identifier prefix.
- Legacy, default-channel, mismatched-mode, duplicate-occurrence, stale, and orphaned hydration reminders are canceled.
- If Expo's scheduled-notification inspection result omits a channel id, valid structured reminder metadata is preserved instead of being treated as a channel mismatch.
- Unrelated app notifications are preserved.
- Reconciliation is idempotent and may force a rebuild when persisted IDs are missing from Expo's scheduled queue.

Controlled preference updates:

- Vibration and Enable Snooze each have one logical event owner: the nested React Native `Switch`.
- The surrounding preference row is visual only and must not attach a second toggle handler.
- Each boolean preference update receives a monotonic operation id in development diagnostics.
- Development diagnostics trace handler entry, canonical read, canonical write, hook state update, schedule reconciliation start/finish, rerender value, and stale reconciliation ignores.
- Async reconciliation must never replace `vibrationEnabled` or `snoozeEnabled` from an older preference snapshot.

Activation state:

- `not_configured`: reminders have not completed a successful app-level enable flow.
- `enabled`: the user enabled reminders and the app may schedule local notifications when OS permission allows.
- `disabled_by_user`: the user explicitly chose not to use reminders or turned them off.

Android notification permission alone does not mean reminders are enabled. The app enables reminders only through the user-facing enable flow or a one-time migration from a previously stored onboarding intent of `enabled`. This prevents launch-time permission checks from re-enabling reminders after a user deliberately turns them off.

Notification category:

- `water_reminder.hydration_reminder.v1`

Action identifiers:

- `water_reminder.reminder.drink`
- `water_reminder.reminder.snooze`
- `water_reminder.reminder.dismiss`

Action identifiers are not user-facing copy and must remain stable for native callbacks and idempotency.

Action foreground behavior:

- Drink now may foreground the app because it commits a hydration entry and refreshes the Home surface.
- Snooze is registered with `opensAppToForeground: false` so a successful Expo notification response can schedule the one-off snooze and dismiss the current notification without visibly opening Water Reminder.
- Dismiss is registered with `opensAppToForeground: false`.
- Expo still owns response delivery. If the app process is killed, non-foreground Snooze handling is not guaranteed without a native Android receiver. Water Reminder does not currently include a custom native action receiver.

## Metadata Contract

Reminder notification data:

```ts
type ReminderNotificationData = {
  type: 'hydration_reminder';
  schemaVersion: 1;
  occurrenceId?: string;
  source: 'scheduled' | 'snoozed' | 'test';
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

Drink now action:

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
-> compute one-off snooze target timestamp
-> suppress snooze if target is within 10 minutes of a normal reminder
-> schedule one one-off snoozed reminder
-> persist pending snooze id and target timestamp
-> dismiss handled notification
```

Snooze/base schedule policy:

- Snooze never mutates the base reminder schedule.
- At most one pending snoozed reminder may exist.
- A new snooze replaces the previous pending snooze.
- If the snooze target is within 10 minutes before or after a scheduled normal reminder, the snooze is suppressed and the normal reminder is preserved.
- Hydration logging clears a pending snooze only after local persistence succeeds.
- Pause, disable, goal completion, and schedule-setting changes clear pending snooze state without canceling unrelated normal notification IDs.

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
