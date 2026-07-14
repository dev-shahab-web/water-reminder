# Production Configuration Audit

Audit date: July 14, 2026

## Source Configuration

| Item                 | Current source value                                                                                                | Status                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| App name             | `Water Reminder` in `app.json`                                                                                      | Ready                                                       |
| Package ID           | `com.shahab.waterreminder`                                                                                          | Ready                                                       |
| Version name         | `1.0.0` in `app.json` and `package.json`                                                                            | Ready                                                       |
| Version code         | `1` in `app.json`; observed installed version code is `1`                                                           | Ready for first upload; increment for any later Play upload |
| Orientation          | `portrait`                                                                                                          | Ready                                                       |
| URL scheme           | `waterreminder`                                                                                                     | Ready                                                       |
| User interface style | `automatic`                                                                                                         | Ready                                                       |
| min SDK              | `28` through `expo-build-properties`                                                                                | Ready                                                       |
| target SDK           | `36` through `expo-build-properties`                                                                                | Ready                                                       |
| compile SDK          | `36` through `expo-build-properties`                                                                                | Ready                                                       |
| Firebase config      | `android.googleServicesFile = ./google-services.json`                                                               | Ready; file must remain untracked                           |
| Plugins              | Expo Router, Splash, SQLite, Health Connect, React Native Firebase app/Crashlytics, widget plugin, build properties | Ready                                                       |

## Assets

| Asset               | Source                                                                              | Status                                                               |
| ------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| App icon            | `assets/images/icon.png`                                                            | Manual visual inspection required                                    |
| Adaptive foreground | `assets/images/android-icon-foreground.png`                                         | Manual visual inspection required                                    |
| Adaptive background | `assets/images/android-icon-background.png`                                         | Manual visual inspection required                                    |
| Monochrome icon     | `assets/images/android-icon-monochrome.png`                                         | Manual visual inspection required                                    |
| Splash              | `assets/images/splash-icon.png`, background `#F7FBF8`                               | Manual visual inspection required                                    |
| Widget mark         | `plugins/water-reminder-widget/android/res/drawable/water_reminder_widget_mark.xml` | Ready; verify in final build                                         |
| Notification icon   | Not explicitly configured in `app.json`                                             | Manual: inspect final manifest/resources and notification appearance |

## Release/Debug Behavior

- `expo-dev-client` remains a dependency for development builds; verify release builds do not show a development launcher or Metro UI.
- Firebase collection is controlled by the in-app diagnostics toggle.
- `google-services.json` is ignored by git and must be supplied securely for local/CI builds.
- Generated Android files must not be manually edited as source of truth; config plugins own native changes.

## User-Visible Release Content

Current source audit changes:

- Removed stale alert title from Settings fallback links.
- Hid GitHub row when no public URL is configured.
- Replaced debug-oriented build fallback with `Local build`.

Manual checks still required:

- Final release APK/AAB must not show Expo Go, Metro, development launcher, template assets, or placeholder legal URLs.
- Repository contains unused Expo/template image assets under `assets/images/`; no source references were found, but manual asset review is recommended before open source or release packaging.
