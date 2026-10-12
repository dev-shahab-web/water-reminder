# Pixel 7 hydration sync validation — 2026-10-11

## Root cause and release diagnosis

The installed Play Store package was version 2.0.1/code 7. Its compiled widget
writer still called `android.database.sqlite.SQLiteDatabase`, while the app used
Expo's bundled SQLite engine against the same database/WAL. The current source
already contained the shared-engine correction, but the shipped artifact did
not. The earlier local AAB also predated the corrected APK.

On the installed Play package, adding 500 ml to the existing 250 ml produced
750 ml in the app and 250 ml in the native snapshot. Only that diagnostic
500 ml entry was removed afterward; the original 250 ml history was preserved.

The Play signing certificate differs from the local upload certificate. The
Play app was not uninstalled or replaced. With the user's approval, an isolated
R8/minified release was installed as `com.shahab.waterreminder.syncvalidation`.
Health Connect permissions were not enabled for this clone; these are local
app/widget checks, not a physical Health Connect interoperability sign-off.

## Physical-device results

The installed validation package reports version `2.0.2-syncvalidation`, code 8.
Runtime logs confirm `WIDGET_STORAGE_ENGINE=expo_shared_v1`.

| Action                                       | Expected shared total | Observed                                       |
| -------------------------------------------- | --------------------: | ---------------------------------------------- |
| App adds 500 ml to fresh data                |                500 ml | App snapshot and placed widget: 500 ml         |
| Widget adds 250 ml                           |                750 ml | Native commit and React Native refresh: 750 ml |
| App adds another 500 ml                      |               1250 ml | Native snapshot: 1250 ml; widget: 1.3 L, 63%   |
| Two rapid widget taps                        |               1750 ml | Two distinct commits: 1500 then 1750 ml        |
| Force-stop and cold-launch after those taps  |               1750 ml | Home: 1750 ml; history: five entries           |
| Edit a widget-created 250 ml entry to 400 ml |               1900 ml | Native snapshot: 1900 ml; widget: 1.9 L, 95%   |
| Delete that edited 400 ml entry              |               1500 ml | Native snapshot: 1500 ml; widget: 1.5 L, 75%   |
| Widget adds 250 ml after deletion            |               1750 ml | Home and native refresh: 1750 ml               |

Widget volume labels use rounded litres above 1000 ml; for example, 1250 ml
renders as 1.3 L. That formatting is not evidence of a different stored total.
The original Play widget remained at its original 250 ml throughout clone tests.
The separate validation app and its widget remain installed for follow-up.

## Prevention and verification

`npm run android:release` checks generated native sources, stamps the source
fingerprint, builds APK and AAB with R8, then verifies both compiled artifacts.
`npm run android:verify-release` rejects missing shared-engine code, stale
fingerprints, wrong versions, and the validation package as a production build.
The release guard has seven regression tests and runs in CI.

- Jest: 42 suites / 227 tests passed.
- Release guard: 7 tests passed.
- Real SQLite Health Connect storage checks passed: edits, stale acknowledgements,
  durable removals, import suppression, ownership, and restore.
- Targeted ESLint and `git diff --check` passed.
- TypeScript check remains blocked by three existing mock typing errors in
  `src/shared/motion/motion-provider.test.tsx` (lines 13, 42, 43); this is not a
  clean full-project typecheck sign-off.
- Production APK/AAB build succeeded with R8. Gradle reported upstream Google
  Play Services auth stack-map warnings; no build failure resulted.

## Production handoff

Version 2.0.2/code 8 production artifacts:

- APK: `android/app/build/outputs/apk/release/app-release.apk`
  SHA-256: `38cf74b816a3a073b319c4fa142b300386cf02a7c758d5badba65ac2d159e744`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
  SHA-256: `e089fed9e0ac07f1abd11d9dd15ddf24b9a1e7a0c77c2331f09b67cdd2bfdd74`
- Validation APK: `android/app/build/outputs/sync-validation/app-syncvalidation.apk`
  SHA-256: `4ec293d5e13f80d097940fc86a54debcb0b4b4bcde8085470446193ca228545b`

Upload the newly verified production AAB to Play internal testing and update
the original app through Play. No Play upload was performed in this task. The
original installed Play package still has the old implementation until updated.
