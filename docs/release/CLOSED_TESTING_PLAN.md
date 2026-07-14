# Closed Testing Plan

## Sequence

1. Internal testing.
2. Play-installed build verification.
3. Firebase Analytics DebugView verification.
4. Crashlytics test report verification.
5. Closed testing track.
6. Pre-launch report review.
7. Production access application if required by the current Play Console account.
8. Staged production rollout.
9. Post-release smoke checks.

## Tester Recruitment

Collect tester opt-in evidence where Play Console requires it. Some accounts may be subject to 12-testers/14-days or other production-access requirements; follow the current dashboard instructions rather than assuming one global rule.

## Feedback Template

Ask testers to report:

- Device and Android version.
- Install source.
- Whether diagnostics were enabled.
- Steps to reproduce.
- Expected result.
- Actual result.
- Screenshots only if they do not expose private health or notification data.

## Severity Rules

- P0: data loss, crash on launch, impossible to log water, privacy leak.
- P1: Health Connect corrupts/duplicates data, widget unusable, reminders unusable.
- P2: visual/accessibility issues, non-blocking sync failures, confusing copy.
- P3: minor polish or documentation issues.

## Version-Code Strategy

Every internal, closed, open, and production upload needs a higher version code than previous Play uploads.

## Rollout

Start with internal testing, then closed testing, then staged production rollout. Monitor Firebase, Play vitals, user feedback, and crash-free sessions before expanding.
