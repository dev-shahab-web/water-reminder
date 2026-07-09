# Component Inventory

## Purpose

This document defines reusable UX components before implementation. It describes purpose, expected props, usage, accessibility, variants, and future extensibility without creating code.

## AppScreen

Purpose:

- Provide consistent screen layout, safe area behavior, and spacing.

Props:

- `title`
- `children`
- `primaryAction`
- `secondaryAction`
- `scrollable`
- `loading`
- `error`

Usage:

- All major screens.

Accessibility:

- Announces screen title.
- Supports large text and screen reader navigation.

Variants:

- Static.
- Scrollable.
- Error state.
- Loading state.

Future extensibility:

- Add app-wide offline or sync status if future features need it.

## HydrationRing

Purpose:

- Visualize today's progress toward goal.

Props:

- `currentAmount`
- `goalAmount`
- `unit`
- `percentage`
- `status`
- `animated`

Usage:

- Home and possibly Statistics summary.

Accessibility:

- Must expose text equivalent such as "1250 of 2000 milliliters, 63 percent complete."

Variants:

- Default.
- Goal complete.
- Over goal.
- Reduced motion.

Future extensibility:

- Support bar variant if ring is less accessible in testing.

## QuickAddButton

Purpose:

- Log a common drink amount quickly.

Props:

- `amount`
- `unit`
- `label`
- `disabled`
- `onPress`

Usage:

- Home quick-add group.

Accessibility:

- Label includes action and amount, for example "Add 250 milliliters."
- Minimum touch target must be preserved.

Variants:

- Default.
- Pressed.
- Disabled.
- Compact.

Future extensibility:

- Support favorite bottle labels.

## GoalCard

Purpose:

- Show daily goal, remaining amount, and goal status.

Props:

- `goalAmount`
- `remainingAmount`
- `unit`
- `isComplete`

Usage:

- Home and Goal Setup confirmation.

Accessibility:

- Does not rely on color alone for completion.

Variants:

- In progress.
- Complete.
- Over goal.

Future extensibility:

- Add goal recommendation explanation.

## ReminderCard

Purpose:

- Summarize reminder state and provide quick controls.

Props:

- `enabled`
- `permissionStatus`
- `activeHours`
- `interval`
- `pausedUntil`

Usage:

- Home and Settings.

Accessibility:

- Toggle labels describe current state.

Variants:

- Enabled.
- Disabled.
- Paused.
- Permission denied.

Future extensibility:

- Add snooze and adaptive reminder summaries.

## HistoryList

Purpose:

- Display grouped hydration history.

Props:

- `items`
- `range`
- `loading`
- `empty`
- `onSelectDay`

Usage:

- History.

Accessibility:

- Supports list semantics and readable date labels.

Variants:

- Recent.
- Weekly.
- Monthly.
- Empty.

Future extensibility:

- Add pagination or search if history grows.

## HistoryItem

Purpose:

- Display one day or one entry depending on context.

Props:

- `date`
- `amount`
- `goal`
- `entryCount`
- `status`

Usage:

- History and day detail.

Accessibility:

- Announces date, amount, goal status, and action.

Variants:

- Goal met.
- Goal missed.
- Today.
- Empty day.

Future extensibility:

- Add notes or beverage type later.

## StatCard

Purpose:

- Summarize a statistic in plain text.

Props:

- `label`
- `value`
- `supportingText`
- `trend`

Usage:

- Statistics.

Accessibility:

- Trend must be described with text, not only icon or color.

Variants:

- Neutral.
- Positive.
- Informational.

Future extensibility:

- Support comparison periods.

## SettingsSection

Purpose:

- Group related settings.

Props:

- `title`
- `description`
- `children`

Usage:

- Settings.

Accessibility:

- Section title creates navigable structure.

Variants:

- Standard.
- Warning.
- Future feature.

Future extensibility:

- Support optional premium labels without blocking core settings.

## SettingsRow

Purpose:

- Represent one setting or navigation option.

Props:

- `label`
- `value`
- `description`
- `icon`
- `onPress`
- `control`

Usage:

- Settings sections.

Accessibility:

- Announces label, value, and control state.

Variants:

- Navigation.
- Toggle.
- Value display.
- Destructive.

Future extensibility:

- Add badges for optional future sync or backup.

## PrimaryButton

Purpose:

- Main action on a screen or flow.

Props:

- `label`
- `disabled`
- `loading`
- `onPress`

Usage:

- Setup, permission, save actions.

Accessibility:

- Label describes the result of pressing.

Variants:

- Default.
- Disabled.
- Loading.

Future extensibility:

- Add icon support if it improves clarity.

## SecondaryButton

Purpose:

- Non-primary or dismissive action.

Props:

- `label`
- `onPress`
- `tone`

Usage:

- Skip, cancel, not now, secondary settings actions.

Accessibility:

- Avoid vague labels like "OK" when action is specific.

Variants:

- Neutral.
- Destructive.
- Quiet.

Future extensibility:

- Support inline text-button style.

## ProgressBadge

Purpose:

- Compact status display for progress states.

Props:

- `status`
- `label`

Usage:

- Home, History, Statistics.

Accessibility:

- Status text must be explicit.

Variants:

- On track.
- Goal met.
- Behind pace.
- Paused.

Future extensibility:

- Add pace-based states later.

## EmptyState

Purpose:

- Explain empty content and provide next action.

Props:

- `illustration`
- `title`
- `message`
- `primaryAction`
- `secondaryAction`

Usage:

- Home, History, Statistics, Today's Log.

Accessibility:

- Illustration is decorative unless it adds meaning.

Variants:

- First use.
- No data.
- Filter empty.
- Permission blocked.

Future extensibility:

- Support product education without marketing bloat.

## LoadingIndicator

Purpose:

- Communicate short waiting states.

Props:

- `label`
- `variant`

Usage:

- Splash, data loading, save operations.

Accessibility:

- Announces loading state when meaningful.

Variants:

- Spinner.
- Skeleton.
- Inline.

Future extensibility:

- Add determinate progress if future import/export exists.

## ErrorView

Purpose:

- Explain a recoverable error and next step.

Props:

- `title`
- `message`
- `primaryAction`
- `secondaryAction`
- `errorType`

Usage:

- Error Recovery, inline failures, permission failures.

Accessibility:

- Error title and recovery action are announced.

Variants:

- Offline.
- Database.
- Permission.
- Notification unavailable.
- Unexpected.

Future extensibility:

- Add support contact action.
