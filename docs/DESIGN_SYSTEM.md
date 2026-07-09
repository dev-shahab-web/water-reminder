# Design System

## Product Design Direction

Water Reminder should feel calm, clean, and practical. The design should prioritize fast daily actions over decorative wellness branding.

## Visual Principles

- Use a light, breathable layout with high contrast.
- Make the current hydration state immediately scannable.
- Keep primary actions close to the user's thumb.
- Use color as support, not the only indicator of progress.
- Avoid guilt-inducing red states for missed goals.
- Support dark mode when the platform theme is ready.

## Core UI Elements

- Progress indicator for daily hydration.
- Quick-add amount controls.
- Numeric input for custom amount.
- Entry list rows with edit/delete actions.
- Reminder controls using toggles, time pickers, and interval selectors.
- Empty states for no logs and no history.
- Confirmation dialogs for destructive actions.

## Tokens and Theme

Use existing SMP theme tokens for:

- Color.
- Spacing.
- Typography.
- Radius.
- Elevation.

No feature screen should hardcode colors or arbitrary spacing once suitable tokens exist.

## Accessibility Requirements

- All controls need accessible labels.
- Progress must be represented textually, not only visually.
- Quick-add controls must remain usable with large text.
- Touch targets should meet mobile accessibility guidelines.
- Motion should be minimal and respect reduced-motion settings.
- Color contrast must pass WCAG expectations for normal and large text.

## Content Tone

- Calm.
- Direct.
- Non-medical.
- Non-judgmental.
- Brief.

Preferred examples:

- "Today's progress"
- "Add water"
- "Pause reminders today"
- "Goal reached"

Avoid:

- "You failed"
- "You must drink now"
- "This will improve your health"

## Assumptions

- React Native Paper is available as the base component system.
- Product-specific components should wrap shared components where needed.
- The first version should not introduce a large custom visual language.
- Icons can support navigation and actions but should not replace accessible labels.

## Edge Cases

- Progress above 100 percent must display cleanly.
- Very large daily goals can create long text values.
- Ounce values may include decimals unless rounded.
- Large text can cause quick-add labels to wrap.
- Colorblind users must understand goal status without relying on color alone.

## Suggested Improvements

- Define product semantic tokens such as `hydration.progress`, `hydration.goalMet`, and `hydration.warningNeutral`.
- Add visual QA across small phone, large phone, and tablet dimensions before implementation is accepted.
- Create copy guidelines for reminders, errors, empty states, and confirmations.
- Add a reusable amount-display component to ensure unit formatting consistency.

## Trade-Offs

- A distinctive water-themed brand can improve memorability, but too much decoration can slow the daily task.
- Compact controls improve speed, but must not harm accessibility.
- Using Paper defaults accelerates delivery, but product wrappers may be needed for long-term consistency.
- Progress rings are visually strong, but progress bars may be easier to read with large text.
