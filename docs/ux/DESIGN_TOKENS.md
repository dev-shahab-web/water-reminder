# Design Tokens

## Purpose

This document defines product-level token intent for UX and design freeze. It does not create or modify technical theme architecture.

## Token Principles

- Use semantic tokens over raw values.
- Keep contrast accessible.
- Avoid hardcoded colors in product surfaces.
- Use spacing consistently to support scanning.
- Reserve strong emphasis for primary actions and critical states.

## Color Semantics

Recommended semantic roles:

- `surface.base`: main screen background.
- `surface.subtle`: grouped setting or summary areas.
- `text.primary`: main readable text.
- `text.secondary`: supporting text.
- `action.primary`: primary CTA.
- `action.secondary`: secondary CTA.
- `hydration.progress`: progress fill.
- `hydration.complete`: goal reached state.
- `hydration.paused`: reminder paused state.
- `status.error`: validation and recovery errors.
- `status.warning`: caution without alarm.
- `border.subtle`: dividers and low-emphasis boundaries.

UX rules:

- Do not use red for missed hydration goals.
- Do not rely on blue alone to communicate water or progress.
- Completion color must have a text label.

## Typography Semantics

Recommended roles:

- `display.small`: primary Home progress number.
- `title.large`: screen title.
- `title.medium`: section title.
- `body.large`: primary body copy.
- `body.medium`: settings and list copy.
- `label.large`: buttons and important controls.
- `label.small`: badges and helper text.

UX rules:

- Avoid hero-scale text in compact panels.
- Support large text without clipping.
- Use concise labels for controls.

## Spacing Semantics

Recommended roles:

- `space.screen`: outer screen padding.
- `space.section`: distance between screen sections.
- `space.group`: distance between related controls.
- `space.control`: internal control padding.
- `space.inline`: spacing between icon and text.

UX rules:

- Primary controls need breathing room.
- Related settings should be visually grouped.
- Quick-add controls should not shift when text changes.

## Radius Semantics

Recommended roles:

- `radius.control`: buttons and inputs.
- `radius.card`: summary cards.
- `radius.modal`: focused task surfaces.

UX rules:

- Radius should feel calm and utilitarian.
- Avoid oversized rounded shapes that reduce density.

## Elevation Semantics

Recommended roles:

- `elevation.none`: default surfaces.
- `elevation.low`: persistent action areas or summary cards.
- `elevation.medium`: modals or temporary overlays.

UX rules:

- Elevation should clarify hierarchy, not decorate.
- Avoid stacked card-on-card layouts.

## Motion Tokens

Recommended roles:

- `motion.fast`: 120-180ms for button feedback.
- `motion.standard`: 200-300ms for progress updates.
- `motion.slow`: 300-450ms for rare screen-level transitions.

UX rules:

- Core logging feedback must feel immediate.
- Reduce Motion replaces animated transitions with instant state changes or fades.

## Haptic Tokens

Recommended roles:

- `haptic.light`: quick-add success.
- `haptic.medium`: goal completion.
- `haptic.warning`: validation or blocked destructive action.

UX rules:

- Haptics should reinforce meaningful actions only.
- Respect platform and device settings.

## Icon Semantics

Recommended roles:

- Add water.
- History.
- Statistics.
- Settings.
- Reminder.
- Pause.
- Edit.
- Delete.
- Success.
- Warning.

UX rules:

- Icon-only controls require accessible labels.
- Icons support recognition but do not replace text for unfamiliar actions.
