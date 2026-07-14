# AAB Build Guide

Codex must not run native build commands during publication audit. These commands are for the human release owner.

## Prerequisites

- `google-services.json` available locally or through secure CI.
- Signing credentials available through secure local/CI configuration.
- Version code set/incremented without lowering existing Play version codes.
- Legal URLs configured through release environment variables if hosted links are used.

## Build

Manual command example:

```sh
cd android
./gradlew bundleRelease
```

Expected output path usually resembles:

```txt
android/app/build/outputs/bundle/release/app-release.aab
```

Verify the exact path from Gradle output.

## Inspect

Before upload:

- Confirm package `com.shahab.waterreminder`.
- Confirm version name `1.0.0`.
- Confirm version code is correct for Play.
- Confirm min SDK 28, target SDK 36, compile SDK 36.
- Confirm no debug launcher or Metro UI.
- Confirm Firebase config is present for release.
- Confirm native widget provider is present.
- Confirm Health Connect hydration permissions only.

## Upload

Upload to internal testing first. Do not upload directly to production without completing Release QA and Firebase verification.

## Future Version Codes

Every Play upload must use a strictly higher version code than any previously uploaded artifact. Never lower version code.
