# Data Safety Guidance

This document prepares Play Console Data Safety answers for Water Reminder. It is release guidance, not a substitute for reviewing the current Play Console form and official Firebase disclosures before submission.

## Data Handling Summary

### 1. Local Hydration Processing

Water Reminder stores hydration entries, goals, reminder preferences, statistics inputs, widget snapshots, and export/import data locally. SQLite is the canonical hydration store. MMKV/preferences store settings and metadata.

This local hydration data is not sent to a Water Reminder backend and is not included in telemetry.

### 2. Local Health Connect Platform Exchange

Health Connect is optional. If the user connects it, Water Reminder requests hydration read/write access only.

Purpose:

- Import hydration records from Android Health Connect.
- Write locally logged hydration records to Health Connect.
- Prevent duplicates with local metadata.

Health Connect data is not sent to Firebase telemetry, advertising, profiling, or a developer backend.

### 3. Optional Firebase Analytics

When `Share anonymous diagnostics` is enabled, Firebase Analytics may receive allowlisted app activity events such as screen views and app interaction names.

Telemetry excludes hydration amounts, totals, goals, percentages, entry IDs, timestamps, Health Connect values, Health Connect record IDs, reminder times, database rows, raw SQL, exports/imports, email addresses, user-entered text, and precise location.

### 4. Optional Firebase Crashlytics

When `Share anonymous diagnostics` is enabled, Firebase Crashlytics may receive crash logs, sanitized handled-error categories, app version, build number, route name, and operational flags.

Crashlytics must not receive hydration content or Health Connect content.

### 5. User-Initiated Email Feedback

Feedback opens the user's email app. The user controls the message. Water Reminder does not automatically attach logs, hydration exports, Health Connect data, screenshots, or raw diagnostics.

### 6. Developer-Controlled Backend

None. Water Reminder has no developer hydration backend, cloud sync, account service, purchases, subscriptions, or advertising service.

## Play Console Data Categories

Recommended answers, subject to manual Play Console and Firebase documentation verification:

| Data type                       | Collected?                                                         | Shared?                                                 | Required?                       | Purpose                                   | Notes                                                                  |
| ------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Health and fitness / hydration  | Processed locally; exchanged with Health Connect only after opt-in | Not shared with developer backend or Firebase telemetry | Optional Health Connect feature | App functionality                         | Declare Health Connect permissions separately.                         |
| App activity / app interactions | Yes, only when diagnostics enabled                                 | Sent to Google Firebase                                 | Optional                        | Analytics, app functionality, reliability | Event names only; no hydration values.                                 |
| Crash logs                      | Yes, only when diagnostics enabled                                 | Sent to Google Firebase                                 | Optional                        | Diagnostics, reliability                  | Crashlytics manual verification pending.                               |
| Diagnostics                     | Yes, only when diagnostics enabled                                 | Sent to Google Firebase                                 | Optional                        | Diagnostics, reliability                  | Sanitized categories and safe attributes only.                         |
| Device or other identifiers     | Possible through Firebase SDKs                                     | Sent to Google Firebase when diagnostics enabled        | Optional                        | Analytics/diagnostics                     | Manual verification required against current Firebase SDK disclosures. |
| Email address                   | Only if user sends feedback email                                  | Sent through user's email provider                      | Optional/user initiated         | Support                                   | App does not collect email in-app.                                     |
| Files and docs                  | Local export/import chosen by user                                 | Not sent automatically                                  | Optional/user initiated         | App functionality                         | User controls exported files.                                          |
| Location                        | No                                                                 | No                                                      | No                              | Not used                                  | Do not declare unless a dependency changes behavior.                   |
| Contacts                        | No                                                                 | No                                                      | No                              | Not used                                  | Not requested.                                                         |
| Advertising ID                  | Not intentionally used                                             | No ad SDK                                               | No                              | Not used                                  | Manual verification required for Firebase/Google SDK behavior.         |

## Play Console Copy

Use qualified wording:

> Hydration records and Health Connect data are stored locally and are never included in telemetry. When the user opts in, anonymous usage events and crash diagnostics may be sent to Google Firebase to improve reliability.

Avoid absolute claims that analytics or diagnostics are absent, or that data never leaves the device. Use the approved qualified wording instead.

## Security And Retention

- Data sent to Firebase is expected to use transport encryption, but this must be verified against current Firebase documentation.
- Local hydration retention is user controlled through app deletion, local reset/delete controls, and export/import behavior.
- Firebase retention is partly controlled by Firebase Console settings and Google policies. Review retention before submission.
- Account deletion is not applicable because Water Reminder has no account system.

## Manual Verification Required

- Confirm Firebase Analytics and Crashlytics current SDK Data Safety disclosures.
- Confirm whether Firebase uses app instance identifiers or other device identifiers for the configured services.
- Confirm Firebase retention settings in the Firebase Console.
- Confirm Play Console Data Safety wording against the active dashboard form.
- Confirm no additional permissions or SDKs are introduced by the final native build.
