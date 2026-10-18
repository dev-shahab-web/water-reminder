# Review reminders and update verification

Verified October 17, 2026 on the user's Pixel 7 (`35201FDH2006ET`, Android 17).
The separate `com.shahab.waterreminder.premiumpreview` debug installation was
updated in place. Production app data and existing hydration records were kept.

## Completed

- Expo prebuild generated the engagement bridge, Play In-App Updates dependency,
  WorkManager dependency, and native test sources successfully.
- Android debug assembly passed. All five native `ReviewCadenceTest` tests passed:
  five-day threshold, weekly threshold, delayed delivery, invalid time/clock
  rollback, and snoozing after opening the store.
- All **49 Jest suites / 277 tests** passed. TypeScript and lint passed.
- ARTEMIS observed the review screen and update screens. ADB used native view IDs
  for the review actions and notification switches. Live screenshots were used
  for visual verification when accessibility snapshots lagged scrolling.
- **I've already reviewed** saved `reviewStatus=reviewed` and `reviewEnabled=false`.
  After restarting the preview, Settings displayed the saved thank-you message
  and the disabled review switch.
- Explicitly enabling review reminders reset the confirmation to `not-confirmed`.
  Turning update notifications off left review reminders enabled; the preferences
  are independent. **Don't remind me** then saved `reviewStatus=never` and disabled
  review reminders.
- **Review on Google Play** opened the correct Lumarc Studio listing. No review was
  submitted or changed. Opening the listing advanced only the snooze timestamp;
  it did not change the existing opt-out into a completed review.
- Android persisted the real day-5/week-1 configuration. JobScheduler showed the
  `EngagementWorker` scheduled for its next check approximately 12 hours later.
  This installation was less than five days old, and no early review reminder was
  posted.
- The native Play query returned no eligible newer version for this preview. The
  manual update screen displayed the corresponding message and check action.
  Play/network failure behavior is covered separately by the service tests.
- Temporary JS display fixtures showed the **Update now** dialog on Home and
  **Restart to update** dialog on Settings. Both fit the Pixel in dark mode with
  readable copy and a **Maybe later** action. Android Back snoozed the available
  dialog; entering Settings did not show it again. The downloaded stage prompted
  separately. These fixtures did not download, install, or simulate Play consent.
- Fixture code and fixture snooze keys were removed, and the preview's original
  engagement preferences were restored after testing.

## Release checks still needed

Use the [Google Play testing procedure](../APP_ENGAGEMENT.md#google-play-release-verification)
to verify a real higher-version update, notification delivery and deduplication,
flexible download progress, immediate/resume fallback, restart, and retained user
data. No real Play download/installation occurred in this session.

The native five-day/week cadence has deterministic unit coverage; actual review
notification delivery at those elapsed times was not waited out. Cold notification
routing needs a bundled testing-track build: this debug build opens the Expo dev
launcher on a cold custom-scheme launch. Warm `/feedback` and `/updates` routes
were verified. Light theme, large font settings and other devices remain visual
release checks.
