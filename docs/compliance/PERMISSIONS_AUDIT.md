# Permissions Audit

This audit is based on `app.json`, Expo config plugins, package dependencies, and source adapters. Final manifest verification must be performed after the native release build is generated.

| Permission / component                               | Source                                                    | Feature                                                                                         | Mandatory?                      | Runtime behavior                                  | Denial behavior                                             | Play declaration                                              | Sensitive/restricted                    |
| ---------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `android.permission.POST_NOTIFICATIONS`              | `expo-notifications` / generated manifest on Android 13+  | Local hydration reminders and test notification                                                 | Optional                        | Requested when the user enables reminders         | App continues without reminders                             | Notification permission disclosure where prompted by Play     | Runtime permission; user-visible        |
| `android.permission.health.READ_HYDRATION`           | `app.json` Android permissions / Health Connect libraries | Import hydration from Health Connect                                                            | Optional                        | Requested only from Settings connection flow      | App remains local-only and shows disconnected state         | Health Connect declaration required                           | Health data permission                  |
| `android.permission.health.WRITE_HYDRATION`          | `app.json` Android permissions / Health Connect libraries | Write local water logs to Health Connect                                                        | Optional                        | Requested only from Settings connection flow      | App remains local-only and does not write to Health Connect | Health Connect declaration required                           | Health data permission                  |
| Widget provider/receiver components                  | `plugins/water-reminder-widget` config plugin             | Android home-screen widget and quick actions                                                    | Optional user-added widget      | No runtime permission prompt                      | App works without widget                                    | Usually no Play permission declaration; review final manifest | Component exposure must be reviewed     |
| Network access, likely `android.permission.INTERNET` | React Native/Firebase/Expo generated manifest             | Optional Firebase telemetry, legal links, email/browser intents, development/runtime networking | Not required for core hydration | No app-specific runtime prompt                    | Offline core still works; telemetry/link opening may not    | Data Safety disclosure for Firebase collection                | Normal permission, but privacy relevant |
| Firebase manifest services/providers                 | React Native Firebase plugins                             | Analytics and Crashlytics when diagnostics enabled                                              | Optional diagnostics            | Controlled by Settings toggle                     | Features continue if unavailable                            | Data Safety disclosure                                        | Privacy relevant                        |
| Media/storage permissions                            | None intentionally requested in app config                | Export/import uses in-app text payload currently                                                | Optional/user initiated         | No storage permission expected from source config | Export/import remains app-controlled                        | Flag if final manifest includes media/storage permissions     | Unexpected if present                   |

## Unexpected Permission Flags

Manual final-build review must flag:

- Any location permission.
- Contacts permission.
- Camera or microphone permission.
- Broad media/storage permission.
- Advertising ID permission.
- Additional Health Connect permissions beyond hydration read/write.

Do not remove permissions without confirming the generated manifest source and feature impact.
