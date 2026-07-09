# Roadmap

## Phase 1: Product Discovery

Status: current phase.

Deliverables:

- Product specification documents.
- MVP scope.
- Data and notification strategy proposals.
- Architectural review handoff.

Exit criteria:

- Product requirements are reviewed.
- Architecture confirms no platform changes are required or documents required changes.
- MVP backlog can be created from approved docs.

## Phase 2: MVP Architecture Review

Goals:

- Validate module boundaries.
- Confirm persistence approach.
- Confirm notification scheduling approach.
- Confirm navigation and screen structure.
- Identify required ADRs or migrations.

## Phase 3: MVP Implementation

Goals:

- Onboarding.
- Settings persistence.
- Hydration logging.
- Dashboard.
- Local reminders.
- History.
- Tests and quality gates.

## Phase 4: Beta Hardening

Goals:

- Device testing on Android and iOS if supported.
- Notification reliability testing.
- Accessibility pass.
- Performance pass.
- Copy and empty-state refinement.
- Store listing preparation.

## Phase 5: Launch

Goals:

- Play Store submission.
- Privacy policy.
- Store screenshots.
- Release checklist.
- Initial metrics review.

## Phase 6: Post-Launch Iteration

Potential improvements:

- Weekly insights.
- Advanced reminders.
- Data export.
- Widgets.
- Health integrations.
- Monetization experiments.

## Assumptions

- Product discovery must complete before application code begins.
- MVP should use existing SMP capabilities.
- Store launch requires separate compliance and privacy work.
- Post-launch priorities should be metric-informed.

## Edge Cases

- Notification reliability issues may force scope changes.
- Accessibility findings may require UI redesign before launch.
- Store review may reject metadata or permissions wording.
- Product requirements may reveal a platform limitation requiring an ADR.

## Suggested Improvements

- Add milestone checklists after architecture review.
- Tag roadmap items as Must, Should, Could, or Later.
- Add a release-readiness scorecard for beta and launch.
- Add research checkpoints before monetization or sync work.

## Trade-Offs

- A lean MVP gets to learning faster, but may have weaker differentiation.
- Delaying integrations reduces risk, but competitors may advertise them.
- Launching before monetization improves trust, but delays revenue data.
- Strong architecture review slows the start of coding, but protects future products on SMP.
