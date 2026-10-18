# Privacy Policy

Effective date: October 17, 2026

## Summary

Water Reminder is an offline-first hydration reminder app. Core hydration tracking works without an account, developer backend, cloud hydration storage, subscription, advertising, or internet connection.

Hydration records and Health Connect data are stored locally and are never included in telemetry. When the user opts in, anonymous usage events and crash diagnostics may be sent to Google Firebase to improve reliability.

## Data Stored Locally

Water Reminder stores these categories on the device:

- Hydration entries in SQLite.
- Daily goal, measurement unit, theme, accessibility, onboarding, and reminder preferences in local preferences/MMKV.
- Notification scheduling identifiers for local reminders.
- Review reminder choices, reminder timestamps, review confirmation, and update notification/version preferences. The app reads Android's installation timestamp to time review reminders.
- Widget snapshot data so the Android home-screen widget can show current local progress.
- Optional Health Connect sync metadata used for duplicate prevention and sync status.
- Local export/import content when the user chooses those actions.

The user controls local retention through export, import, reset, and delete controls in Settings. Deleting app data through Android settings may also remove local app data.

## Optional Plus Purchases

Daily Plus tips and offers are optional and off by default. The opt-in is stored
locally. These notifications are scheduled on the device and do not send hydration
records to a marketing service. Website links include static campaign parameters
identifying the app and entry screen, without purchase or hydration identifiers.
Visiting Lumarc Studio uses your browser and is subject to the website's privacy policy.

Google Play processes optional Plus purchases. The app receives product IDs,
purchase state, signatures and purchase tokens to verify and acknowledge purchases
through Google Play Billing. The app does not receive payment-card details. A local
cache stores verified product IDs and an access validity window for offline use.
Purchase tokens, signatures and hydration data are not sent to app analytics or a
developer billing backend. A Google Play account and internet access are required
for purchases and restoration; core hydration tracking remains offline and free.

## Health Connect

Health Connect is optional and Android-only. Water Reminder requests hydration read/write access only after the user chooses to connect from Settings.

If connected, Water Reminder may:

- Read hydration records from Health Connect.
- Write water logged in Water Reminder to Health Connect.
- Store Health Connect record metadata locally for duplicate prevention.

Water Reminder does not request unrelated health data. Health Connect hydration values and record identifiers are not sent to Firebase telemetry, advertising services, or a developer hydration backend.

Users can disconnect Health Connect in Settings or change permissions in Android system settings. Disconnecting keeps existing local hydration history unless the user separately deletes it.

## Notifications And Widgets

Notifications are local reminders scheduled on the device. Reminder times and schedules are not included in telemetry.

The Android widget reads local app data and can write hydration entries locally when the user taps a widget action. Widget hydration values are not included in telemetry.

Review reminders and update notifications can be disabled separately in Settings.
The app checks Google Play for updates on foreground entry and periodically in the
background. Google Play manages update eligibility, downloads, and installation;
these checks do not send hydration records to Google Play or a developer backend.
Choosing to review opens the Play listing. Google Play does not tell the app whether
a review was submitted; the app only stores the user's own confirmation locally.

## Optional Anonymous Diagnostics

The Settings toggle `Share anonymous diagnostics` controls Firebase Analytics and Crashlytics collection.

Default: off.

When disabled:

- Analytics collection is disabled.
- Crashlytics collection is disabled where supported.
- New telemetry events are not sent.
- Hydration logging, reminders, widgets, SQLite, Health Connect, history, and statistics continue working.

When enabled, Water Reminder may send these non-sensitive categories to Google Firebase:

- Stable screen names.
- Basic app action names, such as opening Settings or using a widget action.
- Sync result categories, such as success or failure.
- Crash diagnostics and sanitized handled-error categories.
- App version and build number.

Water Reminder does not send:

- Hydration amounts.
- Daily totals.
- Hydration goals.
- Completion percentages.
- Hydration history.
- Entry IDs.
- Entry timestamps.
- Health Connect values.
- Health Connect record IDs.
- Reminder times or schedules.
- Database rows or raw SQL.
- Exported or imported file contents.
- User-entered text.
- Precise location.
- Account identifiers.

Firebase and Google act as service providers for optional analytics and crash diagnostics. Firebase retention and processing are partly governed by the Firebase project settings configured by the app publisher and by Google Firebase policies.

## Feedback Email

If the user chooses Feedback, Water Reminder opens the device email app. The user controls the message contents. The app does not automatically attach hydration logs, Health Connect data, exports, screenshots, or raw logs.

## Accounts, Advertising, Sale Of Data

Water Reminder does not require an account. It does not sell personal data. It does not show ads. It does not use health data for advertising or profiling.

## Security And Limitations

Water Reminder uses platform storage and system security features, but no app can guarantee absolute security. Local data may be lost if the app is uninstalled, device storage is cleared, a device is lost, or backups are unavailable. Exported files are controlled by the user and should be stored carefully.

## Policy Changes

Material privacy changes should be reflected in this policy and in the hosted privacy page before release. Users should be informed through release notes or in-app copy when a change meaningfully affects data handling.

## Contact

Use the Feedback link in the app or the support email configured in the Play Store listing for privacy questions or support.
