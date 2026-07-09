# User Journey

## Purpose

This document defines the end-to-end experience from first launch through repeated daily use.

## Journey 1: First-Time User

### Entry

User installs and opens Water Reminder.

### Steps

1. Splash verifies app readiness.
2. Onboarding introduces setup without marketing-heavy content.
3. User selects unit.
4. User accepts or customizes daily goal.
5. User chooses active reminder hours.
6. User decides whether to enable reminders.
7. If reminders are enabled, the app explains notification permission.
8. User lands on Home with today's progress ready.
9. User logs first drink through quick-add.

### Success Moment

The user sees progress update immediately after the first log.

### Risks

- Too much setup can cause abandonment.
- Permission prompts too early can reduce trust.
- Confusing goal recommendations can feel medical.

### UX Requirements

- Defaults must be safe, editable, and non-medical.
- Skip behavior must preserve a usable app.
- First log must be obvious.

## Journey 2: Returning Daily User

### Entry

User opens app to log water.

### Steps

1. Splash resolves quickly.
2. Home shows today's progress.
3. User taps quick-add.
4. Progress and remaining amount update.
5. User exits app.

### Success Moment

The app helps the user track hydration without stealing attention.

### Risks

- Slow startup breaks the habit.
- Too many secondary actions compete with logging.

### UX Requirements

- Quick-add is always available on Home.
- Home must not require network loading.
- The visible state must recover after app restart.

## Journey 3: Reminder-Driven User

### Entry

User receives a local reminder.

### Steps

1. User taps notification.
2. App opens Home for today.
3. User sees relevant progress.
4. User quick-adds water or pauses reminders.
5. App updates reminder behavior as needed.

### Success Moment

The reminder feels like a helpful nudge, not pressure.

### Risks

- Notification fires at a bad time.
- User already met goal.
- Permission is revoked.

### UX Requirements

- Reminders respect active hours.
- Reminder copy is calm.
- Pause is visible when reminders are active.

## Journey 4: Correction And Review

### Entry

User notices an incorrect log.

### Steps

1. User opens Today's Log or History.
2. User selects an entry.
3. User edits amount or deletes entry.
4. App confirms destructive deletion.
5. Progress recalculates.

### Success Moment

The user trusts that mistakes are easy to fix.

### Risks

- Editing feels hidden.
- Deletion is accidental.
- Unit changes cause confusion.

### UX Requirements

- Entries show amount and time.
- Edit and delete are discoverable.
- Destructive actions require confirmation.

## Journey 5: Settings Adjustment

### Entry

User wants to change goal, units, quick-add amounts, or reminders.

### Steps

1. User opens Settings.
2. User selects the relevant section.
3. User updates a value.
4. App validates and saves.
5. Home reflects the change.

### Success Moment

The product adapts to the user's routine without making setup feel permanent.

### Risks

- Settings become too dense.
- Reminder controls become confusing.
- Unit conversion appears inconsistent.

### UX Requirements

- Settings are grouped by user intent.
- Changes are reversible.
- Validation is specific and calm.
