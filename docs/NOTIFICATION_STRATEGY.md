# Notification Strategy

## Goal

Use local notifications to support hydration habits without making the app feel intrusive. Notifications should be predictable, configurable, and respectful of user context.

## MVP Strategy

- Ask for permission only when reminders are enabled.
- Schedule local reminders within the user's active hours.
- Use a configurable interval, with conservative defaults.
- Support Gentle and Active reminder modes.
- Support one-off snooze without changing the base daily reminder schedule.
- Cancel and reschedule notifications when relevant settings change.
- Pause reminders for the rest of the current local day.
- Avoid reminders after the user completes the daily goal unless product review decides otherwise.

## Reminder Modes

Gentle is the default for new and existing users.

Gentle:

- Silent notification.
- Low-disruption Android channel.
- Vibration off by default.
- Calm copy only.

Active:

- System-default notification sound through the Active Android channel.
- Vibration enabled by default when Active is first selected.
- Android default importance, not high importance.
- Must respect Do Not Disturb and user-controlled channel settings.
- Still calm and never alarm-like.

Persistent mode is not implemented. It remains a future product boundary and must not be exposed until reviewed.

## Reminder Copy Principles

- Keep copy short and neutral.
- Avoid guilt, pressure, or medical claims.
- Vary copy sparingly to avoid feeling robotic.
- Make notification payloads structured enough for safe deep linking.

Example tone:

- "Time for a sip."
- "A small sip can help keep the habit going."
- "Small sip, steady habit."
- "Take a moment to hydrate."

## Permission States

- Not determined: explain value, then request permission.
- Granted: schedule reminders according to settings.
- Denied: show reminders as disabled and provide recovery guidance.
- Provisional or platform-specific limited states: normalize through platform notification APIs.

## Scheduling Rules

- Active window defaults should avoid late-night notifications.
- Reminder interval should have a minimum to prevent notification spam.
- If remaining active window is too short, schedule no additional reminders.
- If daily goal is met, cancel remaining reminders for the day.
- If reminders are paused, cancel pending notifications until the pause expires.
- If a reminder is snoozed, schedule one one-off snoozed reminder and preserve the base schedule.
- If snooze is repeated, replace the previous pending snooze.

## Notification Actions

Reminder notifications may expose up to three actions:

- Drink: logs the default quick-add amount through the existing hydration flow.
- Snooze: uses the configured default snooze duration.
- Dismiss: closes the current notification without logging water.

Drink action handling is idempotent by reminder occurrence id. SQLite remains the canonical source of truth; widgets, Redux, Health Connect, and reminder reconciliation are side effects after local persistence.

## Assumptions

- Expo Notifications remains the underlying implementation, accessed only through platform services.
- Local notifications are sufficient for MVP.
- Server-side push is not required.
- Reminder scheduling behavior may differ between iOS and Android and must be tested on both.

## Edge Cases

- User denies permission but leaves reminders enabled in app settings.
- User grants permission, then revokes it at OS level.
- Device battery optimization delays or suppresses notifications.
- Android Doze mode delays one-off or scheduled notifications.
- Device time zone changes after notifications are scheduled.
- User sets sleep time earlier than wake time for overnight schedules.
- User completes goal immediately after a reminder has already fired.
- App is killed when the user presses a notification action.
- User changes Android notification-channel settings outside the app.

## Suggested Improvements

- Add adaptive reminder cadence based on current progress pace.
- Add notification copy preferences: minimal, encouraging, or silent-style.
- Add system-settings deep-link if permission recovery is common.
- Add observability for scheduling failures without collecting sensitive hydration data.

## Trade-Offs

- Fixed intervals are easy to understand, but adaptive reminders may feel more useful.
- Canceling reminders after goal completion is respectful, but some users may want continued gentle hydration prompts.
- Permission prompts during onboarding are efficient, but delayed prompts can create more trust.
- Local notifications protect privacy, but OS behavior limits delivery guarantees.
