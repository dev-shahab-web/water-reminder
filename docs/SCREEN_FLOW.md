# Screen Flow

## MVP Screens

### Onboarding: Welcome / Setup

Purpose: introduce setup and collect initial preferences.

Contains:

- Unit selection.
- Daily goal field.
- Active hours fields.
- Reminder toggle.
- Continue action.

### Notification Permission Screen

Purpose: explain reminders before the native permission prompt.

Contains:

- Short value explanation.
- Enable notifications action.
- Skip action.

### Home Dashboard

Purpose: main daily habit loop.

Contains:

- Today's progress.
- Consumed, remaining, and goal amounts.
- Quick-add controls.
- Custom add action.
- Entry point to today's log.
- Reminder pause action if reminders are enabled.

### Custom Amount Modal

Purpose: log non-standard drink amount.

Contains:

- Numeric amount input.
- Unit label.
- Save and cancel actions.
- Validation messaging.

### Today's Log Screen

Purpose: review and correct today's entries.

Contains:

- Entry list.
- Edit action.
- Delete action with confirmation.
- Daily total summary.

### History Screen

Purpose: review recent progress.

Contains:

- Recent days list or calendar-style summary.
- Daily total.
- Goal status.
- Day detail navigation.

### Settings Screen

Purpose: update preferences.

Contains:

- Goal settings.
- Unit settings.
- Quick-add settings.
- Reminder settings.
- Privacy/local data section.

## Navigation Model

- Onboarding is shown until initial setup is complete.
- Main app uses a simple dashboard-first structure.
- History and settings should be reachable from the dashboard.
- Modals should be used for short focused tasks such as custom amount or edit entry.

## Assumptions

- Expo Router remains the routing layer.
- Screen implementation should follow existing feature-module boundaries.
- MVP does not need a complex tab structure unless product review requires it.
- The dashboard can be the default route after onboarding.

## Edge Cases

- Small devices with large text may not fit all quick-add controls.
- Users may rotate tablets or use unusual screen dimensions.
- A delete confirmation may be inaccessible if implemented as a custom modal without proper focus handling.
- History may be empty for new users.
- Settings changes may require immediate dashboard and notification updates.

## Suggested Improvements

- Validate whether a bottom tab layout is useful after the screen set is final.
- Consider a compact dashboard layout for small screens and large text.
- Add empty states for first-day history and no entries.
- Add a system settings deep-link for notification permission recovery if platform support is reliable.

## Trade-Offs

- A single dashboard-first flow is simpler, but tabs can make history and settings more discoverable.
- Modals are efficient for quick tasks, but full screens may be better for accessibility and complex editing.
- Showing many quick-add sizes increases speed for some users, but can crowd the dashboard.
