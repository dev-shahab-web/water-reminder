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
- Reminder style: Gentle or Active.
- Vibration on or off.
- Snooze enabled or disabled.
- Default snooze duration: 5, 10, 15, 30, or 60 minutes.
- Sound preference: Silent, System default, or Device notification sound.
- Pause reminders today.

Defaults:

- Conservative interval.
- Reasonable daytime active hours.
- Gentle reminder style.
- Silent sound.
- Snooze enabled.
- Default snooze duration of 10 minutes.
- Reminders disabled when user chooses defaults unless product review changes this.

## Reminder Styles

Gentle:

- Recommended default.
- Silent unless the user explicitly changes Sound.
- Vibration off unless the user enables it.
- Best for users who want reminders to stay calm and minimal.

Active:

- More noticeable.
- System-default sound when Active is first selected from the default Gentle state.
- Vibration enabled when Active is first selected.
- Still respectful, non-urgent, and not alarm-like.

Sound:

- Silent keeps notification delivery quiet.
- System default uses Android's default notification sound.
- Device notification sound opens Android notification settings where supported so the user can choose a device-managed sound.
- Android notification channels remain user-controlled after creation.

Persistent:

- Future-only.
- Not exposed in the current product.
- Requires product review before implementation because persistent reminders can easily become intrusive.

## Notification Copy

Tone:

- Brief.
- Calm.
- Non-urgent.
- Non-medical.

Examples:

- "Time for a sip."
- "A little water can help you feel refreshed."
- "Small sip, steady habit."
- "Take a moment to hydrate."
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

## Notification Actions

Actions:

- Drink now.
- Snooze.
- Dismiss.

Drink:

- Logs the default quick-add amount.
- Uses the existing hydration logging flow.
- Must be idempotent by occurrence id.
- Opens the app when Expo requires it.

Snooze:

- Uses the configured default snooze duration.
- Schedules one one-off snoozed reminder.
- Replaces any previous pending snooze.
- Does not modify the base daily schedule.

Dismiss:

- Closes the current notification.
- Does not log hydration.
- Does not modify future reminders.

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
- Pending snoozed reminders are cleared.
- Home shows paused state.
- Reminders resume according to settings on the next local day.

Copy:

- "Reminders paused for today."

## Disable Reminders

Trigger:

- User disables reminders in Settings.

Result:

- Pending reminders are canceled.
- Pending snoozed reminders are cleared.
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
- Doze mode delays notification delivery.
- Battery optimization delays notification delivery.
- App is killed before an Expo notification action response reaches JavaScript.
- Android notification-channel settings are changed by the user.
- Permission is revoked outside the app.

## Acceptance Criteria

- Reminders never fire outside configured active hours by design.
- Users can pause reminders for today from Home or Settings.
- Denied permission does not block app usage.
- Reminder copy remains calm and non-judgmental.
- Snooze never changes the base reminder schedule.
- Drink action never logs the same occurrence twice.
