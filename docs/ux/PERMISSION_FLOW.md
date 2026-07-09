# Permission Flow

## Purpose

This document defines notification permission UX. The app should request permission only when it creates clear user value.

## Permission Principle

Ask after intent, not before trust.

## When To Ask

Ask for notification permission when:

- The user enables reminders during onboarding.
- The user enables reminders in Settings.
- The user attempts to schedule reminders and permission is not determined.

Do not ask when:

- The user chooses manual tracking.
- The user is only logging water.
- Permission has already been denied and recovery requires system settings.
- The app is opened from Splash without reminder intent.

## Pre-Permission Screen

Primary message:

- "Get gentle reminders during the hours you choose."

Secondary message:

- "You can pause or turn them off anytime."

Primary CTA:

- "Enable reminders."

Secondary CTA:

- "Not now."

Privacy note:

- "Your hydration tracking works without notifications."

## Native Prompt Result Handling

Granted:

- Show reminders enabled.
- Schedule according to active hours.
- Route to Home or Reminder Settings depending on origin.

Denied:

- Show permission denied state.
- Keep tracking available.
- Do not prompt repeatedly.

Not determined:

- Keep permission screen available if user returns through reminder intent.

Unavailable:

- Show Notification Unavailable error state.

## Fallback Experience

If permission is denied:

- Home remains fully usable.
- ReminderCard shows "Notifications blocked."
- Settings provides "Open system settings" if supported.
- User can disable reminders to remove blocked-state messaging.

If notifications are unavailable:

- Manual tracking remains available.
- Reminder controls explain the limitation.

## Edge Cases

- Permission granted, then revoked in system settings.
- User enables reminders on one day and pauses them immediately.
- Device has notification restrictions or battery optimization.
- App cannot open system settings.

## Acceptance Criteria

- Permission is never required for core tracking.
- User sees why permission is requested before the native prompt.
- Denied permission does not create a dead end.
- Reminder state stays understandable after permission changes.
