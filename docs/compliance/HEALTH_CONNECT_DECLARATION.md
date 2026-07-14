# Health Connect Declaration

## Summary

Water Reminder uses Android Health Connect only for optional hydration read/write sync. The app remains fully usable without Health Connect.

## Permission Scope

Requested permissions from app configuration:

- `android.permission.health.READ_HYDRATION`
- `android.permission.health.WRITE_HYDRATION`

No unrelated Health Connect permissions are requested.

## Connection Flow

The user initiates connection from Settings. Water Reminder explains:

- What hydration data is read.
- What hydration data is written.
- That access is optional.
- That the app works without access.
- That permissions can be changed in Android system settings.
- That imported records may come from other apps.

## Sync And Duplicate Prevention

- Initial sync reads recent hydration records and writes unsynced local entries.
- Incremental sync uses the last successful sync with overlap.
- Pull-to-refresh performs manual reconciliation from Home.
- Automatic best-effort sync runs after local hydration mutations when connected.
- Duplicate prevention uses Health Connect record IDs, client record IDs, and local entry IDs.

## Data Handling

SQLite remains the canonical local source of truth. Health Connect data is not sent to Firebase Analytics, Firebase Crashlytics, ads, profiling systems, or a Water Reminder backend.

## Disconnect And Revocation

Disconnect attempts to revoke access where supported and clears local sync metadata. It does not delete local hydration history and does not delete records from Health Connect.

## Manual Play Review Notes

- Confirm Play Console Health Connect permission declarations match the final manifest.
- Confirm screenshots show the optional connection explanation if required.
- Confirm store copy avoids medical claims.
