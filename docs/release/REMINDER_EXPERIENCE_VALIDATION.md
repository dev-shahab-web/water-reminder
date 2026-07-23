# Reminder Experience Release Validation

## Purpose

This checklist validates the Gentle and Active reminder experience before release. It should be completed on a signed Android release build because Expo notification-action behavior can differ between development, background, killed, and release states.

## Scope

Validate:

- Gentle reminders.
- Active reminders.
- Snooze.
- Drink action.
- Dismiss action.
- Timezone and DST behavior.
- Permission-denied behavior.
- Android notification-channel overrides.

Do not validate Persistent mode. It is future-only and must not appear in the app.

## Validation Matrix

| Scenario                                      | Expected Result                                                                                                                 | Status                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| App foreground, Gentle reminder received      | Notification appears calmly, silent, no forced modal.                                                                           | Not run in Codex                                                |
| App background, Gentle reminder received      | Notification appears through `hydration-gentle-v1`, silent unless user changed channel settings.                                | Not run in Codex                                                |
| App foreground, Active reminder received      | Notification uses `hydration-active-v1`, system-default sound and vibration where allowed.                                      | Not run in Codex                                                |
| App background, Active reminder received      | Notification is more noticeable than Gentle but does not bypass Do Not Disturb.                                                 | Not run in Codex                                                |
| App removed from recents, notification tapped | App opens Home and shows reminder pulse when Expo delivers the response.                                                        | Not run in Codex                                                |
| App removed from recents, Drink action tapped | If Expo delivers the response, one default quick-add log is persisted exactly once. If not, no false success should be implied. | Not run in Codex                                                |
| Device locked, notification tapped            | App opens through normal Android notification behavior.                                                                         | Not run in Codex                                                |
| Device rebooted after reminders scheduled     | Verify whether Android/Expo preserves pending local notifications; otherwise app bootstrap should reconcile when opened.        | Not run in Codex                                                |
| Snooze tapped repeatedly                      | Latest snooze replaces previous pending snooze; only one snoozed notification remains pending.                                  | Not run in Codex                                                |
| Dismiss tapped                                | Current notification closes, hydration is not logged, future base reminders are preserved.                                      | Not run in Codex                                                |
| Timezone changes                              | Schedule signature changes and reminders are rebuilt for the new timezone.                                                      | Not run in Codex                                                |
| DST boundary day                              | Reminders remain inside active hours; delivery may be subject to Android scheduling behavior.                                   | Not run in Codex                                                |
| Permission denied                             | Reminder controls show blocked/disabled state and manual tracking remains available.                                            | Not run in Codex                                                |
| Android channel overridden by user            | App respects system settings and does not claim it can force sound or vibration.                                                | Not run in Codex                                                |
| Duplicate Drink action callback               | Hydration is logged once by occurrence id.                                                                                      | Covered by automated tests                                      |
| Health Connect enabled during Drink action    | Local log succeeds first; Health Connect sync remains best effort.                                                              | Covered by existing flow; manual release validation recommended |

## Known Android And Expo Limitations

- Expo notification actions are handled by JavaScript when a notification response reaches the app.
- Actions configured not to foreground the app are not guaranteed to run JavaScript when the app process is killed.
- Water Reminder does not implement a custom native BroadcastReceiver in this release.
- Android Doze mode, battery optimization, OEM task killing, reboot behavior, and user channel overrides can delay or suppress notification delivery.
- Android notification channels are user-controlled after creation. The app can create channel defaults, but users can override sound, vibration, and visibility in system settings.

## Pass Criteria

- Gentle remains the default and calm.
- Active is more noticeable but not alarm-like.
- Do Not Disturb is respected.
- Snooze creates exactly one one-off reminder.
- Drink action uses canonical hydration logging and is idempotent.
- Dismiss never logs hydration.
- Reminder copy remains non-guilting and non-medical.
- No notification payload contains hydration amount, goal, reminder time, schedule, Health Connect identifiers, or user identifiers.
