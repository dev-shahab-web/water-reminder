# Data Safety Notes

## Firebase

Water Reminder uses:

- Firebase Analytics.
- Firebase Crashlytics.

These services may transmit anonymous app usage and crash diagnostic data to Google Firebase when the user enables `Share anonymous diagnostics`.

## Excluded From Telemetry

Do not disclose telemetry as collecting hydration content. The app intentionally excludes:

- Hydration amounts.
- Daily totals.
- Goals.
- Hydration history.
- Health Connect values.
- Health Connect record ids.
- Reminder schedules.
- Export/import contents.
- User-entered text.
- Raw SQL or database rows.
- Precise location.
- Account identifiers.

## Health Data

Health Connect hydration data is processed locally and only after explicit user permission.

Health Connect data is not sent to Firebase, a Water Reminder backend, ads, or analytics.

## User Controls

Users can:

- Disable anonymous diagnostics in Settings.
- Disconnect Health Connect in Settings.
- Disable reminders.
- Export, import, reset, or delete local hydration history.

## Play Console Checklist

Before release, verify Data Safety answers against the final store policy wording:

- Diagnostics collection: yes, when enabled.
- App activity analytics: yes, minimal/basic usage events when enabled.
- Health and fitness data: processed locally through Health Connect, not transmitted to telemetry.
- Account data: not collected.
- Location: not collected.
- Contacts: not collected.
- Advertising ID: not used intentionally by Water Reminder.
