# Health Apps Declaration

## Product Category

Water Reminder is a general wellness utility for hydration habit tracking and reminders.

It is not a medical device, diagnostic tool, treatment tool, or clinical decision support product.

## Health Connect Usage

Water Reminder requests Health Connect hydration read/write permissions only.

Purpose:

- Import hydration records from Health Connect when the user chooses to connect.
- Write locally logged water entries to Health Connect.
- Prevent duplicates using local metadata.

## Data Handling

Health Connect hydration data:

- Is optional.
- Is processed locally.
- Is stored in local SQLite only as needed for the hydration history and duplicate prevention.
- Is not sent to Firebase telemetry.
- Is not sent to ads or a backend.

## User Control

Users can:

- Use the app without Health Connect.
- Connect Health Connect from Settings.
- Disconnect Health Connect from Settings.
- Change Health Connect permissions in Android system settings.
- Delete local hydration history.

## Prohibited Claims

Product and store copy must not claim:

- Medical benefit.
- Diagnosis.
- Treatment.
- Clinical monitoring.
- Disease prevention.
