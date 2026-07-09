# Screen Flow

## Purpose

This document defines the screen-level structure for the MVP UX freeze. It supersedes earlier product-level flow sketches for implementation planning while remaining implementation-independent.

## Screen List

- Splash.
- Onboarding.
- Goal Setup.
- Notification Permission.
- Home.
- Custom Amount.
- Today's Log.
- Edit Entry.
- History.
- Statistics.
- Settings.
- Reminder Settings.
- Quick-Add Settings.
- About.
- Error Recovery.

## First Launch Flow

```txt
Splash
-> Onboarding
-> Goal Setup
-> Notification Permission, only if reminders are enabled
-> Home
```

Skip path:

```txt
Splash
-> Onboarding
-> Use Defaults
-> Home
```

## Returning User Flow

```txt
Splash
-> Home
```

## Manual Logging Flow

```txt
Home
-> Quick Add
-> Home with updated progress
```

Custom amount:

```txt
Home
-> Custom Amount
-> Save
-> Home with updated progress
```

## Reminder Flow

```txt
Reminder Notification
-> Home
-> Quick Add
-> Home with updated progress
```

Pause path:

```txt
Reminder Notification
-> Home
-> Pause Reminders Today
-> Home with paused reminder state
```

## Correction Flow

```txt
Home
-> Today's Log
-> Edit Entry
-> Save
-> Today's Log
-> Home
```

Delete path:

```txt
Home
-> Today's Log
-> Entry
-> Delete Confirmation
-> Today's Log with recalculated total
```

## History Review Flow

```txt
Home
-> History
-> Day Detail
-> Edit Entry
-> Save
-> Day Detail
```

## Statistics Flow

```txt
Home
-> Statistics
-> Change Range: Weekly or Monthly
-> Statistics with updated range
```

## Settings Flow

```txt
Home
-> Settings
-> Goal, Units, Reminders, Quick Add, Theme, About
-> Save
-> Settings
-> Home with updated state
```

## Permission Recovery Flow

```txt
Settings
-> Reminder Settings
-> Notification Permission Denied
-> Open System Settings, if available
-> Return to Reminder Settings
```

## Error Recovery Flow

```txt
Any Screen
-> Error Recovery
-> Retry or Return Home
```

## Flow Rules

- Home is the primary destination after setup.
- Core tracking must not depend on Statistics, Settings, or History.
- Notification Permission only appears after the user expresses reminder intent.
- Custom Amount and Edit Entry are focused tasks, not broad settings screens.
- Users can return to Home from any major screen.
