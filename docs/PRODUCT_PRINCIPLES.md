# Product Principles

## Mission

Help people build a calm, reliable hydration habit through fast logging, respectful reminders, and clear daily progress.

## Vision

Water Reminder should become the simplest trusted hydration companion for everyday mobile users: a product that quietly supports daily wellbeing without demanding attention, collecting unnecessary data, or turning a healthy habit into a chore.

Over time, the product may become more personalized, more adaptive, and more integrated with device health ecosystems. That growth must preserve the foundation defined in [Product Vision](./PRODUCT_VISION.md): privacy-first, offline-first, low-friction, respectful, and focused on habit support rather than medical advice.

## Product Motto

Hydration should become a habit, not a task.

## Core Product Principles

### One-Handed Usage

Why it exists:

Users often log water while holding a bottle, walking, working, cooking, or switching between tasks. The app should not require careful two-handed interaction for its primary loop.

Examples:

- Primary logging actions are reachable from the main dashboard.
- Common drink amounts are available as quick actions.
- Destructive or complex actions remain deliberate, but everyday logging stays effortless.

Design implications:

- Place primary actions where they are easy to reach.
- Keep the dashboard focused on today's progress and add actions.
- Avoid dense layouts that require precision tapping.
- Use large enough touch targets for quick-add actions.

Engineering implications:

- Treat the home dashboard as the primary product surface.
- Keep logging flows short and resilient.
- Avoid state transitions that force users through unnecessary screens.
- Preserve local responsiveness even when future integrations exist.

### Less Than Two Seconds To Log Water

Why it exists:

If logging feels slower than remembering the drink mentally, users will stop tracking. Speed is central to retention and is already reflected in [Product Requirements](./PRODUCT_REQUIREMENTS.md), where quick-add logging is a core MVP behavior.

Examples:

- Open app, tap a quick-add amount, progress updates.
- Tap notification, land on today's dashboard, log immediately.
- Repeat common amounts without re-entering values.

Design implications:

- Quick-add options must be visible and understandable.
- The custom amount flow should be short and focused.
- Confirmation should not block normal logging.
- Animation should never delay interaction.

Engineering implications:

- Optimize the local write path for immediate feedback.
- Update visible progress as soon as the entry is accepted.
- Keep logging independent of network connectivity.
- Avoid expensive work during the critical add-entry interaction.

### Offline-First

Why it exists:

Hydration tracking is personal, frequent, and should work anywhere. The core experience must not depend on connectivity, accounts, or external services.

Examples:

- Users can onboard, log water, view today's progress, and review recent history offline.
- Local reminders can operate without a backend.
- Future sync features must enhance the product without becoming required for core usage.

Design implications:

- Avoid UI states that imply the app is unusable without internet.
- Communicate local-first behavior in privacy and trust surfaces.
- Treat sync, backup, and export as optional future enhancements.

Engineering implications:

- Store core hydration data locally.
- Design data ownership so local state remains authoritative for core flows.
- Handle future sync as an additive capability, not a dependency.
- Keep offline error states rare and specific.

### Accessibility By Default

Why it exists:

The product is a daily utility. It must work for users with different vision, motor, cognitive, and assistive technology needs from the beginning, not as a cleanup pass.

Examples:

- Progress is described in text, not only color or shape.
- Quick-add controls have meaningful accessible labels.
- Large text does not break core flows.
- Reminder settings are understandable with screen readers.

Design implications:

- Use sufficient contrast.
- Avoid relying only on color for success, warning, or progress.
- Keep interaction patterns familiar.
- Design empty, error, and confirmation states with clear language.

Engineering implications:

- Include accessibility labels for interactive controls.
- Test important flows with large text and screen reader assumptions.
- Respect reduced motion where animation is used.
- Avoid custom controls where platform-accessible controls are better.

### Performance Is A Feature

Why it exists:

The app's value depends on being faster than the user's loss of intent. Slow startup, delayed logging, or janky progress updates directly weaken the habit loop.

Examples:

- The dashboard opens quickly.
- Quick-add feedback is immediate.
- History views remain responsive with accumulated data.
- Reminder taps do not lead to a loading-heavy experience.

Design implications:

- Keep the first screen focused and lightweight.
- Avoid decorative elements that slow core usage.
- Prefer clear progressive disclosure over overloaded screens.

Engineering implications:

- Measure and protect startup and logging performance.
- Keep the logging path local and synchronous from the user's perspective.
- Avoid unnecessary re-renders in high-frequency surfaces.
- Use persistence and aggregation strategies that scale with history.

### Privacy First

Why it exists:

Hydration data is personal wellness data. Trust is a product feature, and the app should collect the minimum data required to serve the user.

Examples:

- Core features do not require an account.
- Hydration logs remain local unless the user explicitly opts into a future sync feature.
- Analytics, if introduced, avoid raw drink logs unless separately approved.

Design implications:

- Make privacy posture understandable.
- Avoid manipulative permission prompts.
- Explain optional integrations before users enable them.
- Keep privacy claims accurate and modest.

Engineering implications:

- Minimize data collection.
- Separate product analytics from personal hydration records.
- Make future export, backup, or sync features explicit and consent-based.
- Avoid hidden identifiers or unnecessary network calls for core usage.

### Every Tap Should Have Purpose

Why it exists:

Water Reminder should reduce friction, not create a new management burden. Each interaction should help users log, understand, configure, or correct their hydration habit.

Examples:

- No decorative onboarding steps.
- No unnecessary confirmations for safe actions.
- Confirm destructive actions such as deleting entries or resetting today's progress.
- Settings are grouped by real user intent.

Design implications:

- Remove screens that only explain features without enabling action.
- Keep copy brief.
- Prefer direct controls over hidden menus for primary behavior.
- Make secondary options available without competing with logging.

Engineering implications:

- Avoid feature flows that require excessive intermediate state.
- Keep navigation simple.
- Make common actions idempotent and forgiving.
- Track complexity as a product cost during feature review.

### Delight Through Simplicity

Why it exists:

The product should feel good because it is clear, calm, and reliable. Delight should come from reduced effort, not from visual noise or novelty.

Examples:

- A satisfying progress update after logging.
- Gentle completion state when the goal is reached.
- Thoughtful defaults that make setup easy.
- Empty states that guide without lecturing.

Design implications:

- Use restrained motion and visual emphasis.
- Keep the tone supportive and non-judgmental.
- Avoid cluttered wellness dashboards.
- Let the user's progress be the hero.

Engineering implications:

- Build small, reliable interactions before advanced features.
- Keep UI state predictable.
- Ensure defaults are stable and easy to modify.
- Avoid hidden complexity that can create inconsistent behavior.

### Notifications Should Encourage, Never Annoy

Why it exists:

Reminders are helpful only while they feel respectful. Annoying notifications are one of the fastest ways to lose trust and trigger uninstall.

Examples:

- Reminders respect active hours.
- Users can pause reminders for today.
- The app does not notify after the daily goal is complete unless explicitly configured.
- Copy is calm and never guilt-based.

Design implications:

- Give users clear reminder controls.
- Explain notification permission at the moment it is useful.
- Make pause and disable actions easy to find.
- Avoid urgency language.

Engineering implications:

- Centralize reminder scheduling and cancellation behavior.
- Recalculate reminders when settings change.
- Handle denied or revoked permission gracefully.
- Treat notification failures and OS limits as expected conditions.

### Build Healthy Habits Rather Than Maximizing Screen Time

Why it exists:

The product's purpose is to help users drink water and move on with their day. Success means the app supports real-world behavior, not prolonged attention.

Examples:

- Fast logging is better than long sessions.
- History helps reflection but does not become an engagement trap.
- Streaks, if introduced, must avoid guilt.
- No feeds, endless content, or attention loops.

Design implications:

- Prioritize completion and exit over browsing.
- Keep insights practical and brief.
- Avoid gamification that pressures users.
- Celebrate consistency without punishing missed days.

Engineering implications:

- Evaluate engagement metrics carefully.
- Avoid building mechanics that optimize session duration.
- Keep notifications tied to user benefit, not reactivation at any cost.
- Design analytics around successful habit support rather than attention capture.

## Decision Framework

Future feature requests should be evaluated with these questions:

- Does this improve the core hydration habit?
- Does this reduce friction in logging, understanding progress, or managing reminders?
- Does this make the experience simpler or only more feature-rich?
- Does this respect user privacy and data minimization?
- Does this work without requiring internet connectivity for core usage?
- Does this preserve accessibility by default?
- Does this support user wellbeing rather than screen time?
- Does this align with the mission and [Product Vision](./PRODUCT_VISION.md)?
- Does this fit the MVP and future scope described in [Product Requirements](./PRODUCT_REQUIREMENTS.md)?

If a feature does not clearly strengthen the habit loop, it should be deferred or rejected. If a feature creates new complexity, it must provide enough user value to justify that complexity.

## Success Definition

Success is not downloads, revenue, session length, or notification volume.

User success means:

- The user can start tracking without confusion.
- The user can log water quickly and accurately.
- The user receives reminders that feel helpful, not disruptive.
- The user understands today's progress at a glance.
- The user keeps the habit over time because the app reduces effort.
- The user trusts the app with personal wellness data.
- The user can stop using the app at any moment without losing control of their routine.

The best version of Water Reminder helps users drink water, feel oriented, and return to their lives.
