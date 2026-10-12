# AAB Build Guide

Codex must not run native build commands during publication audit. These commands are for the human release owner.

## Prerequisites

- `google-services.json` available locally or through secure CI.
- Signing credentials available through secure local/CI configuration.
- Version code set/incremented without lowering existing Play version codes.
- Legal URLs configured through release environment variables if hosted links are used.

## Build

Regenerate native sources after changing config/plugins, preserving your signing configuration:

```sh
npm run prebuild
npm run android:release
npm run android:verify-release
```

The release command builds both APK and AAB with R8 enabled. It refuses stale
generated widget sources, embeds a source fingerprint, and checks that each
artifact contains the shared Expo SQLite adapter. Do not upload an older AAB
just because a newer APK works on your device. Re-run verification immediately
before uploading; source changes require rebuilding.

Expected output path usually resembles:

```txt
android/app/build/outputs/bundle/release/app-release.aab
```

Verify the exact path from Gradle output.

## Inspect

Before upload:

- Confirm package `com.shahab.waterreminder`.
- Confirm version name matches `app.json` (currently `2.0.2`, code `8`).
- Confirm version code is correct for Play.
- Confirm min SDK 28, target SDK 36, compile SDK 36.
- Confirm no debug launcher or Metro UI.
- Confirm Firebase config is present for release.
- Confirm native widget provider is present.
- Confirm Health Connect hydration permissions only.

## Upload

Upload to internal testing first. Do not upload directly to production without completing Release QA and Firebase verification.

Play App Signing may use a different certificate from local builds. Never
uninstall the user's Play app just to bypass that mismatch. For isolated USB
validation, run `npm run android:sync-validation` and install
`android/app/build/outputs/sync-validation/app-syncvalidation.apk`. This uses a
separate application ID and preserves the Play app's history. Keep telemetry
off and do not use this package for Health Connect interoperability testing.
Re-run `npm run android:release` afterward to restore production artifacts.

## Future Version Codes

Every Play upload must use a strictly higher version code than any previously uploaded artifact. Never lower version code.

## Prepared update — 12 October 2026

- Production shown in Play Console: `2.0.1` / code `7`.
- Prepared update: `2.0.2` / code `8`, package `com.shahab.waterreminder`.
- Upload: `android/app/build/outputs/bundle/release/app-release.aab`.
- AAB SHA-256: `5a2ba698042db2a8fee4adb1688e4b6ed07b3719ff7c9e69af847819c63b3545`.
- Built with R8 and the shared Expo SQLite widget adapter; production source
  fingerprint and upload-key signing checked locally.
- Tests: 227 app tests and 7 release integrity tests passed; SQLite Health
  Connect storage checks passed. See the [Pixel 7 validation report](PIXEL_7_SYNC_VALIDATION_2026-10-11.md)
  for device coverage and existing typecheck limitations.

Suggested Play release notes:

```text
Improved hydration syncing between the app and home-screen widget.
Fixed inconsistencies when adding, editing, or removing water entries.
Improved reliability after restarting the app.
```

The binary and signing secrets are intentionally not committed. Upload the
verified AAB, not the isolated Sync Validation APK. If code 8 has already been
uploaded to any Play track, increment the code and rebuild before uploading.
