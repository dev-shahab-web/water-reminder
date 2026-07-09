# Notification Strategy

## Goal

Use local notifications to support hydration habits without making the app feel intrusive. Notifications should be predictable, configurable, and respectful of user context.

## MVP Strategy

- Ask for permission only when reminders are enabled.
- Schedule local reminders within the user's active hours.
- Use a configurable interval, with conservative defaults.
- Cancel and reschedule notifications when relevant settings change.
- Pause reminders for the rest of the current local day.
- Avoid reminders after the user completes the daily goal unless product review decides otherwise.

## Reminder Copy Principles

- Keep copy short and neutral.
- Avoid guilt, pressure, or medical claims.
- Vary copy sparingly to avoid feeling robotic.
- Make notification payloads structured enough for safe deep linking.

Example tone:

- "Time for some water."
- "A small sip can help keep the habit going."
- "Hydration check-in."

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

## Assumptions

- Expo Notifications remains the underlying implementation, accessed only through platform services.
- Local notifications are sufficient for MVP.
- Server-side push is not required.
- Reminder scheduling behavior may differ between iOS and Android and must be tested on both.

## Edge Cases

- User denies permission but leaves reminders enabled in app settings.
- User grants permission, then revokes it at OS level.
- Device battery optimization delays or suppresses notifications.
- Device time zone changes after notifications are scheduled.
- User sets sleep time earlier than wake time for overnight schedules.
- User completes goal immediately after a reminder has already fired.

## Suggested Improvements

- Add snooze actions after basic scheduling is reliable.
- Add adaptive reminder cadence based on current progress pace.
- Add notification copy preferences: minimal, encouraging, or silent-style.
- Add system-settings deep-link if permission recovery is common.
- Add observability for scheduling failures without collecting sensitive hydration data.

## Trade-Offs

- Fixed intervals are easy to understand, but adaptive reminders may feel more useful.
- Canceling reminders after goal completion is respectful, but some users may want continued gentle hydration prompts.
- Permission prompts during onboarding are efficient, but delayed prompts can create more trust.
- Local notifications protect privacy, but OS behavior limits delivery guarantees.
