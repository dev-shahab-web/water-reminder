# Firebase Release Verification

## Configuration Audit

Source configuration:

- `@react-native-firebase/app`
- `@react-native-firebase/analytics`
- `@react-native-firebase/crashlytics`
- Expo plugins: `@react-native-firebase/app`, `@react-native-firebase/crashlytics`
- Android config file: `google-services.json`, ignored by git

Firebase imports are isolated to `src/platform/telemetry`. Feature modules use the telemetry abstraction and do not import Firebase directly.

## Diagnostics Toggle Verification

1. Fresh install the release candidate.
2. Confirm `Share anonymous diagnostics` is off by default.
3. Use the app normally and confirm no new Analytics events are emitted.
4. Enable diagnostics in Settings.
5. Confirm Firebase Analytics collection becomes active.
6. Disable diagnostics.
7. Confirm future events stop.

## Analytics DebugView Procedure

Manual command examples, adjust package/device as needed:

```sh
adb shell setprop debug.firebase.analytics.app com.shahab.waterreminder
adb shell setprop debug.firebase.analytics.app .none.
```

Validate only allowlisted events:

- `app_open`
- `screen_view`
- `quick_add_used`
- `custom_amount_logged`
- `widget_action_used`
- `goal_completed`
- `settings_opened`
- `notification_clicked`
- `health_connect_connected`
- `health_connect_disconnected`
- `health_connect_sync_started`
- `health_connect_sync_completed`
- `health_connect_sync_failed`

Check event parameters for prohibited data:

- No hydration amounts, totals, goals, percentages, entry IDs, timestamps, Health Connect values, Health Connect record IDs, reminder schedules, database rows, raw SQL, exports/imports, email addresses, user-entered text, or precise location.

## Crashlytics Test Procedure

Do not add a permanent crash-test button.

Recommended safe process:

1. Create a temporary local branch.
2. Add a clearly named temporary test-crash trigger behind a developer-only gesture or local flag.
3. Build a non-production release candidate.
4. Enable diagnostics.
5. Trigger the crash once.
6. Restart the app so Crashlytics can upload the report.
7. Verify the report appears in Firebase Console.
8. Confirm attributes are safe and no user ID is set.
9. Remove the temporary crash trigger.
10. Re-run lint, typecheck, tests, and rebuild.

Crashlytics manual end-to-end verification is pending until this procedure is completed.

## Firebase Console Review

Manual review required:

- Analytics retention settings.
- Crashlytics retention/settings.
- Whether current Firebase SDK disclosures include app instance identifiers or other device identifiers.
- No Firebase Authentication, Firestore, Remote Config, Performance Monitoring, Cloud Messaging, or Ads usage.

## Expected Production Behavior

- Diagnostics default off.
- User can enable/disable diagnostics in Settings.
- Telemetry failures are swallowed and never block hydration logging, widgets, reminders, Health Connect, navigation, export/import, or settings.
- Hydration and Health Connect content is never sent to Firebase by app code.
