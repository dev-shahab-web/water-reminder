# Navigation Flow

## Purpose

This document defines every navigation path and navigation rule before implementation.

## Navigation Model

The MVP should use a Home-first structure.

Primary destinations:

- Home.
- History.
- Statistics.
- Settings.

Focused task destinations:

- Custom Amount.
- Today's Log.
- Edit Entry.
- Goal Setup.
- Notification Permission.
- Reminder Settings.
- Quick-Add Settings.
- About.

## First Launch

```txt
Splash
-> Onboarding
-> Goal Setup
-> Notification Permission
-> Home
```

Rules:

- Notification Permission is skipped if reminders are disabled.
- Onboarding can use defaults.
- Setup completion routes to Home.

## Returning User

```txt
Splash
-> Home
```

Rules:

- Splash should not block longer than necessary.
- If app state is recoverable but incomplete, route to the last required setup step.
- If app state is corrupted, route to Error Recovery with a clear retry path.

## Reminder Notification

```txt
Reminder Notification
-> Home
-> Quick Add
```

Rules:

- Notification deep-links to today's Home.
- Home decides whether the goal is already complete.
- If reminders are paused or disabled, Home still allows manual logging.

## Quick Add

```txt
Home
-> Quick Add action
-> Home
```

Rules:

- Quick Add is an in-place action.
- Do not navigate away on success.
- Show immediate progress feedback.

## Custom Amount

```txt
Home
-> Custom Amount
-> Save
-> Home
```

Cancel path:

```txt
Custom Amount
-> Cancel
-> Home
```

Rules:

- Save is disabled until input is valid.
- Invalid input stays on Custom Amount with specific error copy.

## History And Editing

```txt
Home
-> History
-> Day Detail
-> Edit Entry
-> Save
-> Day Detail
```

Delete path:

```txt
Day Detail
-> Delete Entry
-> Confirm Delete
-> Day Detail
```

Rules:

- Editing preserves the user's place in History.
- Deleting requires confirmation.
- Recalculation is visible immediately after save or delete.

## Settings

```txt
Home
-> Settings
-> Reminder Settings
-> Settings
```

```txt
Home
-> Settings
-> Quick-Add Settings
-> Settings
```

```txt
Home
-> Settings
-> Goal Setup
-> Settings
```

Rules:

- Settings changes save explicitly when risk of accidental change is high.
- Simple toggles can save immediately if feedback is clear.
- Returning Home must show updated progress and reminder state.

## Error Paths

```txt
Any Screen
-> Error Recovery
-> Retry
-> Previous Screen
```

```txt
Any Screen
-> Error Recovery
-> Return Home
```

Rules:

- Unexpected errors should avoid data loss.
- Recovery copy should identify the action that failed.
- Home should remain available when possible.

## Back Behavior

- Back from setup before completion returns to the previous setup step.
- Back from Home exits or backgrounds according to platform convention.
- Back from focused tasks returns to the launching screen.
- Back from settings subsections returns to Settings.
- Back must not silently discard unsaved destructive changes.
