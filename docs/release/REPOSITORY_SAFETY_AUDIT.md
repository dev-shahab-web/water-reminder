# Repository Safety Audit

Audit date: July 14, 2026

## Secret And Artifact Scan

Local scan found:

- `./google-services.json`
- `./android/app/google-services.json`
- `./android/app/debug.keystore`

These are in ignored paths or generated native folders and should not be committed. Confirm with `git status --ignored` before release.

## Gitignore Coverage

`.gitignore` covers:

- `google-services.json`
- Firebase tokens/service accounts.
- `*.jks`
- `*.keystore`
- `keystore.properties`
- APK/AAB outputs.
- Android/iOS generated folders.
- Android Studio `.idea/`.
- native symbol/mapping outputs.

## Firebase Safety

- Firebase imports are isolated to `src/platform/telemetry`.
- No `setUserId` usage found in source scan.
- `google-services.json` must remain untracked.
- Crashlytics test triggers must be temporary and removed before release.

## Native/Release Artifacts

Generated native folders are ignored. Do not commit release APK/AAB files, mapping files, native symbols, keystores, or local signing config.

## Placeholder And Development Content

Release audit removed stale fallback copy from Settings surfaces. Manual final-device QA still needs to verify no dev launcher, Metro, Expo Go, template assets, placeholder URLs, or raw native exceptions are visible.

## Manual Review Findings

- Old Expo/template image assets were removed after source references were updated to `assets/branding/`.
- Legal URL environment variables must be configured before publication or Settings will use bundled fallback alerts.
- GitHub row is hidden unless `EXPO_PUBLIC_GITHUB_URL` is configured.
- Crashlytics end-to-end upload remains pending manual verification.
