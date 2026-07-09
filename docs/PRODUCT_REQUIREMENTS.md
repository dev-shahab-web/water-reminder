# Product Requirements

## Scope

This document defines the MVP requirements for Water Reminder. It intentionally avoids platform architecture changes and focuses on product behavior that can be implemented through existing SMP patterns.

## Functional Requirements

### Onboarding

- Ask for basic hydration preferences: daily goal, preferred unit, wake time, sleep time, and reminder preference.
- Provide a sensible default daily goal.
- Allow users to skip personalization and use defaults.
- Explain notification permission at the moment it becomes useful.

### Daily Tracking

- Show today's consumed amount, goal, remaining amount, and progress percentage.
- Support one-tap quick-add drink sizes.
- Support custom amount logging.
- Allow editing and deleting today's entries.
- Preserve tracking locally while offline.

### History

- Show daily totals for recent days.
- Show whether each day met the goal.
- Allow users to inspect previous daily logs.

### Reminders

- Schedule recurring hydration reminders during allowed hours.
- Support pausing reminders for the rest of the day.
- Support disabling reminders entirely.
- Respect quiet hours.
- Recalculate reminders when goal, wake time, sleep time, unit, or permission state changes.

### Settings

- Edit daily goal.
- Change unit between milliliters and ounces.
- Change quick-add sizes.
- Change reminder interval and active hours.
- Reset today's progress with confirmation.
- Export local data in a future release if feasible.

## Non-Functional Requirements

- Core app usage must work offline.
- Data writes must be reliable and recoverable after app restart.
- Notifications must use the platform notification service, not direct Expo calls from features.
- Hydration persistence must use repository boundaries over SQLite.
- App copy must avoid diagnosis, treatment, or guaranteed health outcomes.
- Primary actions must be accessible through screen reader labels.

## MVP Acceptance Criteria

- A new user can complete onboarding and see a configured home screen.
- A user can log water in under two taps from the home screen after setup.
- A user can change their goal and see today's progress recalculate.
- A user can receive reminders only during configured active hours.
- A user can deny notifications and still use tracking features.
- A user can restart the app and retain settings, logs, and notification preferences.

## Out of Scope for MVP

- Accounts and cloud sync.
- Social features.
- Medical recommendations.
- Wearable integration.
- Barcode scanning.
- AI coaching.
- Server-driven content.
- Cross-device backup.

## Assumptions

- SQLite stores hydration logs and daily rollups.
- MMKV may store lightweight preferences where appropriate, but source-of-truth decisions require architectural review.
- Expo Notifications can handle local reminder scheduling for the MVP.
- React Native Paper and existing theme tokens are the UI foundation.
- No backend is required for v1.

## Edge Cases

- User changes unit after logging drinks.
- User changes goal midway through the day.
- User logs a drink near midnight.
- User deletes all entries for a day.
- Device clock changes manually.
- App is force-stopped and scheduled notifications behave differently by platform.
- Notification permission is granted, then revoked in system settings.

## Suggested Improvements

- Add onboarding presets such as Light, Standard, and Active.
- Add a "snooze for 1 hour" reminder action.
- Add weekly insights once enough history exists.
- Add backup/export before adding account sync.
- Add hydration streaks only after deciding whether they fit the product tone.

## Trade-Offs

- Storing raw entries enables edits and better history, but requires aggregation logic.
- Storing daily totals is simpler for charts, but loses detail unless raw entries remain.
- Asking for notification permission early can improve setup completion, but delayed permission prompts may earn more trust.
- Custom quick-add sizes improve fit, but defaults must be good enough for most users.
