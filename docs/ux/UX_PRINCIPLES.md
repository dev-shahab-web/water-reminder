# UX Principles

## Purpose

These principles translate the frozen product philosophy into UX decisions. They extend [Product Principles](../PRODUCT_PRINCIPLES.md), respect the boundaries in [Anti-Goals](../ANTI_GOALS.md), and guide every screen, flow, component, motion, and state.

## Thumb-First Navigation

Primary actions should be reachable during one-handed use.

Implications:

- Place frequent actions near the lower half of the screen.
- Keep quick-add actions visible on Home.
- Avoid placing primary logging behind menus.
- Keep destructive actions deliberate but not buried.

Acceptance test:

- A returning user can open the app and log water with one hand.

## Less Than Two Seconds To Log Water

Logging is the most important interaction in the product.

Implications:

- Quick-add must be available immediately on Home.
- The first successful log should require no typing.
- Progress feedback should appear instantly.
- No network, animation, or modal should block quick-add.

Acceptance test:

- From Home, a user can complete a quick-add entry in under two seconds.

## Zero Unnecessary Taps

Every tap must either log, configure, correct, understand, or recover.

Implications:

- Avoid decorative onboarding steps.
- Avoid confirmations for safe actions.
- Require confirmation for destructive actions.
- Prefer direct controls over hidden nested menus.

Acceptance test:

- Removing any step from a core flow would make the flow less clear or less safe.

## Calm Visual Language

The app should feel useful, quiet, and respectful.

Implications:

- Use clear hierarchy instead of visual noise.
- Avoid guilt-based colors or language.
- Make progress readable without pressure.
- Use empty states that guide, not shame.

Acceptance test:

- Missed goals and empty history states remain neutral and supportive.

## Motion With Purpose

Motion should clarify state changes, not entertain or delay.

Implications:

- Animate progress changes after logging.
- Keep transitions short.
- Avoid looping decorative motion.
- Respect Reduce Motion.

Acceptance test:

- Disabling motion does not remove meaning or block task completion.

## Accessibility First

Accessibility is part of the design baseline.

Implications:

- Every icon-only action needs an accessible name.
- Progress must have a text equivalent.
- Touch targets must remain usable with large text.
- Color must never be the only status cue.

Acceptance test:

- A screen reader user can complete onboarding, log water, review progress, and edit settings.

## Delight Without Distraction

Delight should come from reduced effort and thoughtful feedback.

Implications:

- Celebrate goal completion gently.
- Make successful actions feel immediate.
- Keep copy short and human.
- Avoid gamification that creates pressure.

Acceptance test:

- The user feels rewarded for progress without being pulled into extra screen time.

## Privacy In The Interface

Privacy should be visible in product decisions, not only policy text.

Implications:

- Do not ask for accounts in core flows.
- Explain notification permission before the native prompt.
- Clearly label future backup or sync as optional.
- Avoid requesting unrelated permissions.

Acceptance test:

- A user can understand why each permission or setting exists.
