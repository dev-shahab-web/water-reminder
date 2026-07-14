# Android Signing

## Play App Signing

Use Google Play App Signing for production. Keep the upload key separate from any local debug key.

## Upload Key Safety

Never commit:

- `*.jks`
- `*.keystore`
- `keystore.properties`
- passwords
- Firebase service accounts

Store upload keys in a password manager or secure secret store. Keep an offline backup in a separate secure location.

## Local Configuration

Use local environment variables or ignored `keystore.properties` for signing values. Do not place secrets in `app.json`, source files, docs, or CI logs.

## Certificate Export

Before Play upload, export the upload certificate fingerprint using the Android/Java tooling chosen for the release pipeline and record it in the private release notes.

## Signature Verification

Manual release step:

- Verify the signed artifact uses the intended upload key.
- Confirm package ID is `com.shahab.waterreminder`.
- Confirm version code is incremented and never reduced.

## Current Strategy Note

The project has previously produced an arm64-v8a signed APK for device validation. For Play distribution, confirm whether the launch artifact should be a universal AAB or an architecture-limited artifact. Arm64-only is a manual launch decision and may exclude some devices.
