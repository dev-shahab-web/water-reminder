# Health Connect Integration

## Purpose

Health Connect is an optional Android enhancement for users who want Water Reminder hydration records to sync with Android Health Connect.

The integration does not change the core product promise:

- Water Reminder works offline.
- No account is required.
- No backend or cloud sync is introduced.
- Hydration logs remain local-first.
- Health Connect can be disconnected without breaking the app.

## Supported Data

Water Reminder requests hydration data only.

Read access:

- Hydration records from Health Connect.
- Record time.
- Record amount.
- Health Connect record id.
- Client record id when available.
- Data origin package when available.

Write access:

- Hydration amount.
- Start and end time.
- Local client record id.

Water Reminder does not request activity, sleep, weight, nutrition, location, contacts, or unrelated health permissions.

## Consent Model

Health Connect permission is requested only after the user opens Settings and chooses to connect.

The app must explain:

- What Water Reminder reads.
- What Water Reminder writes.
- Why hydration access is useful.
- That the integration is optional.
- That permissions can be changed in Android system settings.
- That imported hydration may come from other apps.

The app must not repeatedly prompt after denial or imply medical benefit.

## Platform Behavior

Health Connect is Android-only.

Supported states:

- `available`: Health Connect can be used.
- `provider_update_required`: Health Connect exists but needs an update.
- `unavailable`: Android device does not currently support Health Connect.
- `unsupported`: non-Android platforms such as web.

Unsupported platforms use the same domain interface and return a typed unsupported state. UI should remain stable and explain that Health Connect is Android-only.

## Sync Policy

Initial sync:

- Reads the previous 365 days.
- Writes unsynced local Water Reminder entries.
- Imports external hydration records.

Incremental sync:

- Reads from the last successful sync with a one-day overlap.
- Writes new unsynced local Water Reminder entries.
- Skips records already known locally.

Manual sync:

- Triggered from Settings.
- Updates the last sync result and status.
- Refreshes today's hydration state after completion.

Home pull-to-refresh:

- Triggered by the standard pull gesture on Home.
- Awaits the shared SQLite database readiness path before reading data.
- Reloads today's local entries from SQLite before sync.
- Syncs Health Connect only when available and already connected.
- Reloads today's entries from SQLite again after sync.
- Refreshes the Android home-screen widget from the canonical local result.
- Keeps local Home data visible if Health Connect sync fails.

Automatic best-effort sync:

- Queued after successful local hydration mutations such as quick add, custom add, edit, undo, and delete.
- Coalesces rapid local changes so repeated taps do not start repeated Health Connect syncs.
- Never rolls back or fails local hydration logging when Health Connect is unavailable or temporarily failing.
- Uses the same duplicate-prevention rules as manual sync.

SQLite remains the canonical local source of truth. Health Connect is a reconciliation target/source, not the owner of Home state.

## Duplicate Prevention

Water Reminder prevents duplicates using:

- Health Connect record id.
- Health Connect client record id.
- Local entry id when it matches the Health Connect client record id.

Imported records use `source = health_connect`.

Local records written to Health Connect keep their local id as the client record id.

## Local Storage

SQLite stores hydration entries and Health Connect metadata:

- `healthConnectRecordId`
- `healthConnectClientRecordId`
- `healthConnectDataOrigin`
- `healthConnectSyncedAt`

MMKV stores sync metadata only:

- `healthConnectLastError`
- `healthConnectLastSyncIso`
- `healthConnectLastSyncStatus`

## Export And Import

Local export includes Health Connect metadata so a user can restore explainable sync history on the same app.

Import remains local. It does not automatically upload, write to Health Connect, or contact any backend.

After import, Health Connect sync should still require user-controlled connection and manual sync behavior.

## Disconnect Behavior

Disconnecting Health Connect:

- Revokes app permissions where supported.
- Clears local sync status metadata.
- Keeps local hydration history.
- Does not delete Health Connect data from the system.

## Product Boundaries

Health Connect must never become:

- Required for core hydration tracking.
- A reason to require accounts.
- A cloud sync replacement.
- A broad health data collection surface.
- A medical or diagnostic feature.
- An analytics or advertising data source.

Any expansion beyond hydration read/write requires product, privacy, and architecture review.

## Publication Declaration Summary

Recommended Play Console wording:

- Category: general wellness hydration tracking.
- Data type: Health Connect Hydration only.
- Read justification: reconcile hydration records logged in other apps with local Water Reminder history and avoid duplicates.
- Write justification: write water logged in Water Reminder to Health Connect so the user can keep hydration records consistent across apps.
- Consent: explicit opt-in from Settings; no first-launch prompt.
- Disconnect: available from Settings; permissions can also be changed in Android system settings.
- Storage: SQLite remains the canonical local source of truth.
- Sync: initial sync, automatic best-effort sync after local mutations, manual Sync now, and Home pull-to-refresh reconciliation.
- Telemetry: Health Connect values and record IDs are excluded from Firebase Analytics and Crashlytics.
- Claims: no diagnosis, treatment, disease prevention, medical-device functionality, advertising, or profiling based on health data.

## Failure Handling

Health Connect failures must be recoverable and calm:

- Raw native, Java, Kotlin, SQLite, or stack-trace errors are not shown in production UI.
- Home may show: "Health sync could not complete. Your local data is safe."
- Settings may show: "Health sync is temporarily unavailable. Try again."
- The Sync now action remains available after transient failures.
- Local hydration logging, widgets, reminders, and statistics continue to use SQLite data.
