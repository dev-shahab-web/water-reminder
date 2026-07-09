# Anti-Goals

## Purpose

This document defines what Water Reminder intentionally will not become. It protects the product from drifting away from the mission defined in [Product Principles](./PRODUCT_PRINCIPLES.md), the positioning defined in [Product Vision](./PRODUCT_VISION.md), and the MVP scope defined in [Product Requirements](./PRODUCT_REQUIREMENTS.md).

Anti-goals are not limitations caused by lack of time. They are deliberate product boundaries.

## Product Non-Negotiables

The following principles are considered non-negotiable unless a major product direction change is approved:

- Offline-first core experience.
- Privacy-first data handling.
- Fast logging.
- Calm notifications.
- Accessibility by default.
- No mandatory accounts.

## This Application Will NOT Become A Social Network

Why:

Hydration is a personal habit. Social feeds, friend graphs, public streaks, likes, comments, and competitive leaderboards would shift the product from calm self-support to social performance.

This protects:

- User privacy.
- Low-friction daily use.
- Non-judgmental habit building.
- Product simplicity.

## This Application Will NOT Require User Accounts

Why:

The core habit loop does not need identity. Requiring accounts before users can log water would create friction and weaken trust.

Accounts may be considered later only for optional sync, backup, or paid entitlement needs. They must never become required for core tracking.

This protects:

- Offline-first usage.
- Fast onboarding.
- Data minimization.
- User control.

## This Application Will NOT Require Cloud Sync For Core Features

Why:

Users should be able to set goals, log water, receive local reminders, and review recent progress without internet connectivity or backend availability.

Cloud sync may become an optional convenience feature. It must not become the foundation of the core experience.

This protects:

- Reliability.
- Privacy.
- Offline-first behavior.
- Platform independence.

## This Application Will NOT Use Dark Patterns

Why:

The product exists to support wellbeing. It should never manipulate users into granting permissions, buying upgrades, maintaining streaks, watching ads, or sharing data.

Rejected patterns include:

- Guilt-based streak recovery.
- Hidden opt-outs.
- Misleading permission prompts.
- Forced upgrade paths.
- Confusing cancellation or restore flows.

This protects:

- Trust.
- User autonomy.
- Long-term product credibility.

## This Application Will NOT Spam Notifications

Why:

Notifications should encourage, never annoy. Excessive reminders train users to disable notifications or uninstall the app.

The app should avoid:

- Notifications outside configured active hours.
- Repeated prompts after a user pauses reminders.
- Urgent or guilt-based copy.
- Notifications designed only to increase opens.

This protects:

- User attention.
- Reminder credibility.
- Retention through usefulness rather than pressure.

## This Application Will NOT Display Intrusive Advertisements

Why:

Intrusive ads interrupt the logging loop, reduce trust, and are poorly aligned with a calm wellness utility.

The app should avoid:

- Full-screen interstitials.
- Ads before or after logging.
- Notification ads.
- Ads that resemble system alerts or app controls.

This protects:

- Speed.
- Trust.
- Accessibility.
- Product focus.

## This Application Will NOT Collect Unnecessary Personal Data

Why:

Hydration logs and wellness routines are personal. The app should collect only what is needed to provide user-visible value.

The app should avoid:

- Collecting raw hydration logs for analytics without explicit approval.
- Collecting precise location for generic hydration reminders.
- Collecting contacts or social graph data.
- Using hidden identifiers for unrelated tracking.

This protects:

- Privacy-first positioning.
- Store compliance.
- User trust.
- Future extensibility without privacy debt.

## This Application Will NOT Become Bloated With Unnecessary Features

Why:

The product should make hydration easier. Adding loosely related wellness, diet, fitness, journaling, or productivity features can dilute the core habit and slow the experience.

Features should be rejected when they:

- Do not improve hydration tracking, reminders, progress, or trust.
- Add configuration burden without meaningful benefit.
- Create screens users must navigate around to complete the core action.
- Belong better in a different product.

This protects:

- Simplicity.
- Performance.
- Maintainability.
- Clear product identity.

## This Application Will NOT Prioritize Engagement Over User Wellbeing

Why:

The app should help users drink water and leave. Long sessions, compulsive mechanics, and attention loops are not success.

The app should avoid:

- Infinite feeds.
- Excessive badges.
- Pressure-based streaks.
- Notification strategies optimized only for reopens.
- Metrics that treat session duration as inherently positive.

This protects:

- Healthy habit formation.
- Calm product tone.
- Ethical product measurement.
- User autonomy.

## This Application Will NOT Lock Important Functionality Behind Paywalls

Why:

Core hydration support should remain useful without payment. Monetization should enhance convenience and personalization, not make the free product intentionally frustrating.

Important free functionality includes:

- Daily goal tracking.
- Quick-add logging.
- Custom amount logging.
- Basic reminders.
- Recent history.
- Local storage.

This protects:

- Fairness.
- Trust.
- Product adoption.
- Mission alignment.

## This Application Will NOT Require Internet Connectivity For Core Usage

Why:

Water tracking happens throughout ordinary life, including places with weak or no connectivity. The app should not fail when the network is unavailable.

Core usage includes:

- Onboarding with defaults.
- Logging water.
- Editing and deleting entries.
- Viewing today's progress.
- Reviewing recent local history.
- Managing local reminder preferences.

This protects:

- Reliability.
- Offline-first principles.
- Fast interaction.
- User confidence.

## Feature Evaluation Checklist

When a new feature is proposed, evaluate it against these questions:

- Does the feature require an account for core usage?
- Does it require internet connectivity for a core habit flow?
- Does it collect personal data that is not necessary for visible user value?
- Does it add notifications that users did not explicitly ask for?
- Does it increase screen time without improving hydration behavior?
- Does it make logging slower or harder to understand?
- Does it introduce social pressure, comparison, or public performance?
- Does it rely on guilt, urgency, scarcity, or confusing opt-outs?
- Does it place essential hydration functionality behind payment?
- Does it make the product harder to explain in one sentence?

If the answer to any of these questions is yes, the feature should be rejected, redesigned, or deferred until it can be made consistent with the anti-goals.

## Rejection Guidance

Reject a feature when:

- It violates privacy without a strong, explicit, user-controlled benefit.
- It weakens offline-first core usage.
- It makes the primary logging loop slower.
- It turns reminders into pressure or reactivation mechanics.
- It shifts the product toward social networking, diet tracking, medical advice, or general wellness bloat.
- It exists mainly to improve business metrics while reducing user trust.

Defer a feature when:

- The idea may be valuable later but adds too much scope now.
- The feature requires research, policy review, or architectural approval.
- The user benefit is plausible but not yet tied to the core habit.

Redesign a feature when:

- The underlying user need is valid, but the proposed solution violates one or more anti-goals.
- A simpler, local-first, privacy-preserving version can solve most of the problem.

## Product Boundary

Water Reminder is a personal hydration habit utility. It should remain useful, calm, private, fast, and respectful.

Anything that pulls the product away from that boundary needs a strong product case and architectural review before it moves forward.
