# Haptic Feedback

## Purpose

Haptics should reinforce meaningful actions without becoming noisy. They must respect platform conventions and device settings.

## Global Rules

- Use haptics sparingly.
- Never use haptics as the only feedback.
- Do not trigger haptics repeatedly during scrolling or passive viewing.
- Avoid haptics for every navigation tap.
- Respect operating system and device haptic settings.

## Quick Add

When:

- After a quick-add entry is successfully accepted.

Feedback:

- Light success haptic.

Why:

- Confirms a frequent, high-value action without requiring extra attention.

Fallback:

- Visual progress update and accessible announcement.

## Custom Amount Save

When:

- After a valid custom amount is saved.

Feedback:

- Light success haptic.

Why:

- Confirms successful logging.

Fallback:

- Return to updated Home or list state.

## Goal Complete

When:

- The user reaches the daily goal for the first time that local day.

Feedback:

- Medium success haptic.

Why:

- Marks a meaningful milestone.

Fallback:

- Static complete badge and accessible announcement.

## Error

When:

- User attempts to save invalid input or an action fails.

Feedback:

- Warning haptic, if platform convention supports it.

Why:

- Helps identify blocked action.

Fallback:

- Inline error message and focus movement.

## Long Press

When:

- If long press is used for secondary entry actions.

Feedback:

- Light selection haptic.

Why:

- Confirms the long press was recognized.

Fallback:

- Visible action menu.

## Delete Confirmation

When:

- User confirms deletion, not when opening the confirmation.

Feedback:

- Medium haptic.

Why:

- Reinforces a destructive state change.

Fallback:

- Entry disappears and total recalculates.

## Reminder Pause

When:

- User pauses reminders for today.

Feedback:

- Light haptic.

Why:

- Confirms reminder state changed.

Fallback:

- Paused badge and updated ReminderCard.

## Do Not Use Haptics For

- Splash.
- Passive loading.
- Every screen navigation.
- Notification permission prompt display.
- Statistics range changes unless they commit a meaningful setting.
