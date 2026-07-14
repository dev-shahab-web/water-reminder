# Release Checklist

## Firebase Console

- Create or verify the Firebase project.
- Add Android app package `com.shahab.waterreminder`.
- Download `google-services.json`.
- Place `google-services.json` at the repository root locally or through CI secure files.
- Do not commit `google-services.json`.
- Enable Firebase Analytics.
- Enable Firebase Crashlytics.
- Configure Firebase data retention settings.
- Verify no Firebase Authentication, Firestore, Remote Config, Performance Monitoring, Cloud Messaging, or Ads services are enabled for the app.

## Native Build Verification

Run manually outside Codex:

- `npm install`
- `npx expo prebuild --platform android --clean`
- Build a development build.
- Build a release APK/AAB.
- Install on a physical Android device.

## Analytics Validation

- Enable `Share anonymous diagnostics` in Settings.
- Use Firebase Analytics DebugView.
- Validate only allowlisted events appear.
- Confirm no amounts, totals, goals, timestamps, Health Connect ids, reminder schedules, or user-entered text appear.
- Disable `Share anonymous diagnostics`.
- Confirm new events stop.

## Crashlytics Validation

- Use a non-production crash test build.
- Trigger a controlled test crash or handled error.
- Confirm Crashlytics receives safe attributes only.
- Confirm no user id is set.
- Confirm hydration and Health Connect values are absent.

## Privacy And Compliance

- Publish or host `legal-site/privacy-policy.html`.
- Confirm Play Console privacy policy URL points to the hosted policy.
- Review `docs/compliance/DATA_SAFETY.md`.
- Review `docs/compliance/HEALTH_APPS_DECLARATION.md`.
- Confirm store listing does not claim medical benefit.

## Regression

- Verify onboarding.
- Verify Home logging.
- Verify pull-to-refresh.
- Verify Health Connect sync.
- Verify widgets.
- Verify reminders.
- Verify history/statistics/settings.
- Verify diagnostics toggle persistence after restart.
