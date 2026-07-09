# User Stories

## Onboarding

- As a new user, I want to choose my preferred unit so amounts make sense to me.
- As a new user, I want a suggested daily goal so I can start without research.
- As a new user, I want to set my wake and sleep times so reminders do not bother me at night.
- As a new user, I want to understand why notifications are requested before I grant permission.

## Tracking

- As a user, I want to add a common drink size in one tap so tracking feels effortless.
- As a user, I want to enter a custom amount so I can log any bottle or glass.
- As a user, I want to edit a mistaken entry so my daily total stays accurate.
- As a user, I want to delete an accidental entry so the app does not punish mis-taps.
- As a user, I want today's progress to update immediately after logging water.

## Reminders

- As a user, I want reminders only during active hours so the app respects my routine.
- As a user, I want to pause reminders for today so I can stop notifications when I am busy or unwell.
- As a user, I want reminders to adapt when I change my goal or schedule.
- As a user who denied notification permission, I want the app to remain useful for manual tracking.

## History

- As a user, I want to see recent daily totals so I can understand my pattern.
- As a user, I want to know which days met my goal so I can reflect without manual math.
- As a user, I want to review previous entries so I can correct mistakes.

## Settings

- As a user, I want to change my goal because my routine changes.
- As a user, I want to customize quick-add sizes because my glass or bottle has a specific volume.
- As a user, I want to disable reminders entirely because I may only want tracking.
- As a user, I want to reset today's logs with confirmation because mistakes happen.

## Assumptions

- User stories are written for MVP and near-term v1, not all future wellness features.
- Stories should map to feature modules without requiring platform-layer changes.
- The primary user value is habit completion, not advanced analytics.

## Edge Cases

- A user may log water before onboarding is fully completed if onboarding is resumable.
- A user may enter zero, negative, extremely large, or non-numeric custom amounts.
- A user may change time zones while reminders are scheduled.
- A user may use the app with notification permissions denied forever.
- A user may change units and expect existing data to display consistently.

## Suggested Improvements

- Convert the stories into acceptance-test scenarios before implementation.
- Tag each story by release phase during backlog planning.
- Add explicit accessibility stories before UI implementation.
- Add analytics events only after privacy policy and consent decisions are made.

## Trade-Offs

- Comprehensive edit/delete stories increase MVP reliability, but add more UI and repository work.
- Supporting custom quick-add sizes creates personalization value, but requires validation and settings complexity.
- History stories improve retention, but the home screen must remain the main habit loop.
