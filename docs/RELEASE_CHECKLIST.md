# Release Checklist

## Automated Verification

Run before every release candidate:

- `npm run lint`
- `npm run typecheck`
- `npm test`

## Firebase Console

- Create or verify Firebase project.
- Add Android app package `com.shahab.waterreminder`.
- Download `google-services.json`.
- Place `google-services.json` at the repository root locally or through CI secure files.
- Do not commit `google-services.json`.
- Enable Firebase Analytics.
- Enable Firebase Crashlytics.
- Configure Firebase retention settings.
- Verify no Firebase Authentication, Firestore, Remote Config, Performance Monitoring, Cloud Messaging, or Ads services are used by Water Reminder.

## Native Build Verification

Run manually outside Codex:

- Install dependencies.
- Generate native Android project if needed.
- Build release APK/AAB.
- Install through Play internal testing where possible.
- Confirm package, version name, version code, min SDK, target SDK, icons, splash, widget, and Health Connect permissions.

## Analytics Validation

- Confirm diagnostics default off.
- Enable `Share anonymous diagnostics` in Settings.
- Use Firebase Analytics DebugView.
- Validate allowlisted events only.
- Confirm no amounts, totals, goals, timestamps, Health Connect IDs, reminder schedules, user-entered text, exports/imports, raw SQL, or database rows appear.
- Disable diagnostics.
- Confirm future events stop.

## Crashlytics Validation

- Use a non-production crash test build.
- Add a temporary crash trigger only on a local branch.
- Trigger once with diagnostics enabled.
- Restart the app to upload the report.
- Confirm Crashlytics receives safe attributes only.
- Confirm no user ID is set.
- Remove the temporary crash trigger.

## Privacy And Compliance

- Publish or host `legal-site/privacy-policy.html`.
- Publish or host `legal-site/terms-of-use.html`.
- Confirm Play Console privacy policy URL points to hosted policy.
- Review `docs/compliance/DATA_SAFETY.md`.
- Review `docs/compliance/HEALTH_APPS_DECLARATION.md`.
- Review `docs/compliance/HEALTH_CONNECT_DECLARATION.md`.
- Review `docs/compliance/PERMISSIONS_AUDIT.md`.
- Confirm store listing does not claim medical benefit, guaranteed reminders, or that no data ever leaves the device.

## Release QA

- Complete `docs/release/RELEASE_QA.md`.
- Complete Firebase verification.
- Complete repository safety audit.
- Complete Play internal testing.
- Review Play pre-launch report.

## Rollout

- Start internal.
- Move to closed testing if required.
- Follow current Play Console production-access instructions.
- Use staged production rollout.
- Monitor Firebase, Play vitals, user feedback, and crash-free sessions.
