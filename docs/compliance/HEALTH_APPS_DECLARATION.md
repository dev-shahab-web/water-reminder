# Health Apps Declaration

## Product Category

Water Reminder is a general wellness utility for hydration habit tracking, reminders, history, statistics, widgets, and optional Android Health Connect hydration synchronization.

It is not a medical device, diagnostic tool, treatment tool, disease-prevention product, or clinical decision support product.

## Health/Fitness Benefit

Recommended Play Console copy:

> Water Reminder helps users build a hydration habit by logging water intake, showing local progress, sending optional local reminders, and optionally syncing hydration records with Android Health Connect.

## Health Connect Data Type

Exact requested Health Connect data type:

- Hydration.

No activity, sleep, weight, nutrition, location, contacts, or unrelated health data is requested.

## Read Permission Justification

Recommended copy:

> Water Reminder reads hydration records from Health Connect only after explicit user permission so the app can reconcile water logged in other apps with the local hydration history and avoid duplicate records.

## Write Permission Justification

Recommended copy:

> Water Reminder writes water logged in the app to Health Connect only after explicit user permission so the user can keep hydration records consistent across apps that use Health Connect.

## User Control

Users can:

- Use Water Reminder without Health Connect.
- Connect Health Connect from Settings.
- Disconnect Health Connect from Settings.
- Revoke permissions in Android system settings.
- Use manual Sync now.
- Use Home pull-to-refresh reconciliation.
- Delete local hydration history.

## Sync Behavior

- SQLite remains the canonical local source of truth.
- Initial sync imports and writes hydration records after permission.
- Automatic best-effort sync runs after local mutations when connected.
- Pull-to-refresh reconciles local SQLite data and Health Connect.
- Duplicate prevention uses Health Connect record IDs, client record IDs, and local metadata.

## Privacy Boundaries

Health Connect data:

- Is optional.
- Is processed locally.
- Is not sent to Firebase telemetry.
- Is not sent to a developer backend.
- Is not used for advertising, profiling, or account linking.

## Prohibited Claims

Do not claim:

- Diagnosis.
- Treatment.
- Disease prevention.
- Clinical accuracy.
- Medical-device functionality.
- Guaranteed reminders.
- Hydration recommendations for medical conditions.
