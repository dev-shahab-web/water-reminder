# Reminder Experience

## Purpose

Reminders should support hydration without becoming pressure. This document defines reminder UX across setup, notifications, Home, and Settings.

## Reminder Principles

- Encourage, never annoy.
- Respect active hours.
- Keep copy calm.
- Make pause and disable easy.
- Stop when the daily goal is complete unless explicitly configured otherwise.

## Reminder Setup

Settings:

- Reminders enabled or disabled.
- Active start time.
- Active end time.
- Reminder interval.
- Pause reminders today.

Defaults:

- Conservative interval.
- Reasonable daytime active hours.
- Reminders disabled when user chooses defaults unless product review changes this.

## Notification Copy

Tone:

- Brief.
- Calm.
- Non-urgent.
- Non-medical.

Examples:

- "Time for some water."
- "Hydration check-in."
- "A small sip can keep the habit going."

Avoid:

- "You are behind."
- "Drink now."
- "Do not break your streak."
- "Your health depends on this."

## Notification Tap Behavior

Path:

```txt
Notification
-> Home
-> Quick Add
```

Rules:

- Open today's Home.
- Do not force a modal.
- Allow immediate quick-add.
- If goal is already complete, show complete state and do not pressure logging.

## Home Reminder State

Home should show:

- Whether reminders are active, paused, disabled, or blocked.
- Pause reminders today action when relevant.
- Permission recovery path only when helpful.

## Pause Reminders Today

Trigger:

- User selects pause action.

Result:

- Pending reminders for the local day are canceled or suppressed.
- Home shows paused state.
- Reminders resume according to settings on the next local day.

Copy:

- "Reminders paused for today."

## Disable Reminders

Trigger:

- User disables reminders in Settings.

Result:

- Pending reminders are canceled.
- Notification permission remains unchanged at OS level.
- Manual tracking remains fully available.

## Goal Complete Behavior

When user reaches goal:

- Stop or suppress remaining reminders for the day.
- Show calm completion feedback.
- Do not encourage excessive intake.

## Permission Denied Behavior

When permission is denied:

- Reminder controls show blocked state.
- Manual tracking remains available.
- Do not repeatedly prompt.
- Offer system settings recovery if supported.

## Edge Cases

- Active hours cross midnight.
- User changes time zone.
- User changes goal after reminders are scheduled.
- User pauses reminders, then re-enables manually.
- Device suppresses scheduled notifications.
- Permission is revoked outside the app.

## Acceptance Criteria

- Reminders never fire outside configured active hours by design.
- Users can pause reminders for today from Home or Settings.
- Denied permission does not block app usage.
- Reminder copy remains calm and non-judgmental.
