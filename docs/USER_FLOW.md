# User Flow

## First Launch Flow

1. User opens app.
2. App presents onboarding.
3. User selects unit or accepts default.
4. User accepts recommended daily goal or edits it.
5. User sets active hours or accepts defaults.
6. User chooses reminder preference.
7. If reminders are enabled, app explains notification value and requests permission.
8. App saves preferences.
9. User lands on the home dashboard.

## Daily Use Flow

1. User opens app or receives a reminder.
2. User views today's progress.
3. User taps a quick-add amount or enters a custom amount.
4. App records the entry locally.
5. App updates progress and today's log.
6. App adjusts remaining reminder behavior if needed.

## Reminder Flow

1. App schedules reminders for active hours.
2. User receives reminder.
3. User opens app from notification or ignores it.
4. If opened, app lands on today's dashboard.
5. User logs water, pauses reminders, or changes settings.

## Correction Flow

1. User opens today's log.
2. User selects an entry.
3. User edits amount or deletes entry.
4. App confirms destructive delete.
5. App recalculates daily total.

## Settings Flow

1. User opens settings.
2. User changes goal, unit, quick-add sizes, or reminders.
3. App validates input.
4. App persists changes.
5. App updates dashboard and reminder schedule.

## Assumptions

- The home dashboard is the primary app destination after onboarding.
- Onboarding can be completed with defaults.
- Notification permission is requested only if the user enables reminders.
- A notification tap deep-links to the home dashboard for today's date.

## Edge Cases

- User exits onboarding midway.
- User denies notification permission after enabling reminders.
- User opens a reminder after the scheduled day has changed.
- User logs above the daily goal.
- User changes settings while reminders are pending.
- User crosses time zones between reminder scheduling and delivery.

## Suggested Improvements

- Add resumable onboarding state so partial setup does not trap the user.
- Add a "log from reminder action" capability in a later release if supported cleanly.
- Add onboarding completion analytics only after privacy decisions are finalized.
- Add a recovery prompt if notifications are enabled in-app but disabled at OS level.

## Trade-Offs

- Requesting permission during onboarding is efficient, but asking after users see value may improve opt-in.
- Deep-linking reminders to home is simple, but notification actions could reduce friction later.
- Allowing onboarding skip reduces abandonment, but defaults must be defensible.
