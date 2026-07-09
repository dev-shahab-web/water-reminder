# Animation Guidelines

## Purpose

Animation should clarify feedback and state changes. It must never slow down logging, hide information, or become decorative noise.

## Global Rules

- Prefer short, calm animations.
- Avoid looping decorative animation.
- Respect Reduce Motion.
- Preserve meaning when animation is disabled.
- Do not animate layout in ways that cause text overlap.

## Quick Add Success

Trigger:

- User taps a quick-add amount.

Duration:

- 120-180ms for button feedback.
- 200-300ms for progress update.

Easing:

- Standard ease-out.

Purpose:

- Confirm the entry was recorded and progress changed.

Reduce Motion fallback:

- Immediate progress update with no animated interpolation.

## Custom Amount Save

Trigger:

- User saves a valid custom amount.

Duration:

- 150-250ms.

Easing:

- Standard ease-out.

Purpose:

- Confirm save and return focus to updated progress.

Reduce Motion fallback:

- Instant return with updated state.

## Goal Complete

Trigger:

- Today's total reaches or exceeds goal for the first time that day.

Duration:

- 300-450ms.

Easing:

- Gentle ease-out.

Purpose:

- Mark completion without pressure or spectacle.

Reduce Motion fallback:

- Static complete badge and accessible announcement.

## Screen Transition

Trigger:

- User navigates between major screens.

Duration:

- Platform default or 200-300ms.

Easing:

- Platform convention.

Purpose:

- Maintain spatial orientation.

Reduce Motion fallback:

- Platform reduced-motion behavior or simple fade.

## Modal Open And Close

Trigger:

- Custom Amount, Edit Entry, or confirmation opens.

Duration:

- 180-250ms.

Easing:

- Platform default.

Purpose:

- Show focused task context.

Reduce Motion fallback:

- Instant open and close.

## Validation Error

Trigger:

- User attempts invalid save.

Duration:

- 120-180ms if visual emphasis is used.

Easing:

- Ease-out.

Purpose:

- Draw attention to the invalid field.

Reduce Motion fallback:

- Static error text and focus movement.

## Reminder Paused

Trigger:

- User pauses reminders for today.

Duration:

- 150-250ms.

Easing:

- Ease-out.

Purpose:

- Confirm reminder state changed.

Reduce Motion fallback:

- Static paused badge appears.

## Loading Transitions

Trigger:

- History or statistics loads local data.

Duration:

- Skeletons can appear immediately if loading exceeds a short threshold.

Easing:

- No decorative easing required.

Purpose:

- Avoid perceived blankness.

Reduce Motion fallback:

- Static skeleton or loading label.
