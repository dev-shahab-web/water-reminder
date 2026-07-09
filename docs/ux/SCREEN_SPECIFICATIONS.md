# Screen Specifications

## Purpose

This document defines every MVP screen before implementation. It is a UX specification, not a technical implementation plan.

## Splash

Purpose:

- Prepare the app and determine the correct destination.

Primary action:

- None. This screen should be automatic.

Loading state:

- Minimal brand mark or app name with accessible loading label.
- Avoid long animations.

Exit condition:

- Route to Onboarding if setup is incomplete.
- Route to Home if setup is complete.
- Route to Error Recovery only if required state cannot be read.

Accessibility notes:

- Screen reader announces "Water Reminder loading" only if the screen lasts long enough to be meaningful.
- No flashing or looping motion.

## Onboarding

Goals:

- Explain the product in one calm sentence.
- Collect or skip basic setup.
- Start the user without pressure.

User flow:

- Welcome.
- Unit preference.
- Reminder preference.
- Continue to Goal Setup.
- Use defaults path.

Skip behavior:

- "Use defaults" completes setup with default unit, goal, quick-add sizes, and reminders disabled.
- Skip must not create a broken or limited app.

Edge cases:

- User exits midway.
- User changes unit after goal entry.
- User has large text enabled.
- User does not want reminders.

## Notification Permission

When should it appear?

- Only after the user enables reminders or chooses a reminder-based setup.
- Before the native permission prompt.

What should it say?

- Primary message: "Get gentle reminders during the hours you choose."
- Secondary message: "You can pause or turn them off anytime."
- Primary CTA: "Enable reminders."
- Secondary CTA: "Not now."

When should it NOT appear?

- When reminders are disabled.
- When permission is already granted.
- When permission is denied and recovery must happen through system settings.
- During basic manual tracking.

Fallback experience:

- If permission is denied, tracking remains fully usable.
- Reminder settings show permission denied with a recovery action if supported.

## Goal Setup

Default goal:

- Provide a sensible non-medical default.
- Explain that the goal is editable.

Custom goal:

- User can enter a custom amount in the selected unit.
- User can use presets if included in the final design.

Validation:

- Amount is required.
- Amount must be greater than zero.
- Extremely low or high values show calm guidance.
- Save is disabled or blocked until valid.

Accessibility:

- Unit is announced with the input.
- Validation errors are readable by screen readers.
- Presets and custom input remain usable with large text.

## Home

Purpose:

- Show today's hydration progress and make logging water fast.

Primary CTA:

- Quick-add water amount.

Secondary actions:

- Custom amount.
- Today's Log.
- Pause reminders today.
- History.
- Statistics.
- Settings.

Empty state:

- Illustration: simple water glass or droplet.
- Primary message: "No water logged yet today."
- Secondary message: "Add your first drink to start today's progress."
- Primary CTA: first quick-add amount.

Animation ideas:

- Progress ring or bar animates to the new value after logging.
- Goal complete state uses a short, calm completion pulse.
- Reduce Motion replaces animation with immediate state change.

Offline behavior:

- Home works fully offline.
- No offline banner is needed unless a future online-only feature is visible.

Acceptance criteria:

- User can log water from Home in under two seconds.
- User can understand consumed, remaining, goal, and percent progress.
- User can exceed 100 percent without layout breakage.
- User can reach correction and settings flows.

## History

Filtering:

- Default to recent days.
- Support weekly or monthly filtering if included in MVP.
- Future filters should not obscure recent history.

Grouping:

- Group by local date.
- Show total amount, goal status, and entry count.

Empty state:

- Illustration: simple calendar or glass outline.
- Primary message: "No history yet."
- Secondary message: "Your logged days will appear here."
- Primary CTA: "Go to Home."

Performance considerations:

- Use date windows for long histories.
- Avoid rendering all historical entries at once.
- Keep day rows compact and scannable.

## Statistics

Charts:

- Use simple charts for hydration totals and goal completion.
- Charts must include text summaries.
- Avoid charts that require color alone to understand.

Weekly:

- Show daily totals for the current or selected week.
- Show weekly average and goal completion count.

Monthly:

- Show daily or weekly aggregate trends.
- Keep monthly view readable on small screens.

Accessibility:

- Provide chart summaries in text.
- Ensure data points can be understood without precise visual inspection.
- Avoid tiny touch targets.

## Settings

Organization:

- Hydration goal and unit.
- Quick-add sizes.
- Reminders.
- Appearance.
- Data and backup.
- About.

Reminder controls:

- Enable or disable reminders.
- Active hours.
- Reminder interval.
- Pause reminders today.
- Permission recovery status.

Theme:

- Follow system by default.
- Light and dark choices can be future options if supported.

Backup (future):

- Label as optional and future-facing.
- Do not imply cloud sync is required.

About:

- App version.
- Privacy summary.
- Wellness disclaimer.
- Support and policy links when available.

## Custom Amount

Purpose:

- Add a drink amount not represented by quick-add options.

Primary action:

- Save amount.

Validation:

- Numeric input only.
- Must be greater than zero.
- Very large amounts require confirmation or guidance.

Exit condition:

- Save returns to launching screen with updated progress.
- Cancel returns without changes.

## Today's Log

Purpose:

- Review and correct today's entries.

Primary action:

- Edit an entry.

Secondary actions:

- Delete entry.
- Add custom amount.

Empty state:

- Same message family as Home, with CTA back to quick-add.

Accessibility:

- Each entry announces amount, time, and available actions.

## Edit Entry

Purpose:

- Correct a logged amount.

Primary action:

- Save changes.

Secondary action:

- Delete entry.

Validation:

- Same as Custom Amount.

Exit condition:

- Return to the launching list with recalculated totals.
