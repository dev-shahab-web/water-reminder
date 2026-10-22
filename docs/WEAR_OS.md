# Wear OS companion

Water Reminder has a native Kotlin/Compose Material 3 companion in `wear/`.
It supports Wear OS 3 and newer (API 30+), including round Galaxy and Pixel
watches. Older Samsung watches running Tizen are not compatible.

The phone remains the source of truth. The watch displays today's progress,
logs the phone's quick amounts, and can undo its own recent entries. Goal,
units, dark theme palette, bundled fonts, and reduced motion follow the phone.
A Daily hydration tile opens logging; a short-text or ranged-value watch-face
complication displays goal progress. These surfaces never write a drink just
because they became visible.

## Data and entitlement

- Both APKs use `com.shahab.waterreminder` and **the same signing certificate**.
  The validation pair uses `.syncvalidation`. Different package IDs or debug
  and release signatures cannot communicate over Data Layer.
- Google Play services Data Layer carries a versioned snapshot and one durable
  desired-state DataItem per watch drink. It can use Bluetooth or Google's cloud
  relay. No developer hydration server or Firebase hydration event is involved.
- Only the phone's existing native Google Play verifier grants Plus. JavaScript
  preferences never grant native entitlement. Watch access lasts at most 24 hours
  after verification, with an elapsed-time deadline to prevent clock rollback
  extending it. Reboot requires a fresh phone snapshot.
- Watch taps commit to SQLite before confirmation. A UUID identifies each drink;
  revision 1 means add and revision 2 means undo. The phone commits the record
  and deduplication receipt in one transaction using **Expo's SQLite engine**.
  Retries and delayed receipts cannot double-count the drink.
- The watch applies the canonical total and matching receipts together. Pending
  changes remain optimistic until acknowledgment. Locked entries remain queued
  for re-verification; invalid entries stop retrying. Only acknowledged DataItems
  are removed. A failed network write never clears the local outbox.
- Up to 200 pending changes are retained; the UI asks for a sync before accepting
  more. Commands older than 30 days are rejected. Confirmed local history is kept
  for 30 days, with the most recent three entries available for undo. The full
  history stays on the phone. Deleting watch app data removes unsynced drinks.
- Native watch entries and undo use the phone's existing Health Connect permission
  and deletion queue. The watch requests no Health Connect, location, heart-rate,
  activity, or sensor permission.
- One phone node is bound on first sync. Moving to another phone requires a watch
  app reset after syncing pending drinks. An older snapshot or another node cannot
  overwrite the bound phone's state.

## Battery and accessibility

No polling service, always-on sensor stream, exact alarm, or idle animation runs.
WorkManager performs serialized, event-triggered sync with exponential backoff.
The UI collects state while visible; its minute/expiry clock stops in the
background. The water level animates only when its value changes and honors
reduced motion. Tiles and complications refresh on changes and at day/access
boundaries; validity intervals prevent a delayed background job from showing an
expired daily total. Native Wear scrolling supports rotary input, swipe dismissal,
large touch targets, scalable type, semantics, and confirmation haptics.

## Build and install

Use the project's Node 22, Java 21 and Android SDK 36 environment under Linux/WSL.
The Expo plugin `plugins/water-reminder-wear/withWaterReminderWear.js` registers
the phone bridge and the `:wear` module. Templates and `wear-protocol/` are the
source of truth; do not maintain hand edits inside generated `android/`.

```sh
npm run prebuild
npm run android:release
npm run android:wear
adb -s PHONE_SERIAL install -r android/app/build/outputs/apk/release/app-release.apk
adb -s WATCH_SERIAL install -r wear/build/outputs/apk/release/wear-release.apk
```

Use the real production package for Google Play test-account Plus verification.
For isolated debug validation without a production purchase:

```sh
npm run android:sync-validation
npm run android:wear -- --validation
adb -s PHONE_SERIAL install -r android/app/build/outputs/sync-validation/app-syncvalidation.apk
adb -s WATCH_SERIAL install -r wear/build/outputs/apk/release/wear-release.apk
```

Pair the real watch to the phone with its normal vendor companion first. Enable
ADB on the watch for development, select its serial explicitly, and open Water
Reminder on both devices. Plus → Wear OS companion on the phone shows connection
status and offers manual sync. Emulator pairing uses Android Studio's Pair
Wearable assistant and Google's companion app; an emulator without Google Play
sign-in cannot complete that setup.

`npm run android:wear` builds the production APK and AAB and checks release
identity, debug-fixture exclusion, and certificate equality when the phone APK
is present. The shared protocol participates in the phone's source fingerprint.
Release signing comes from the existing `keystore.properties`. For Play delivery,
both form factors must use the same Play app-signing key, not just the upload key.
Reserve the watch version-code range (currently 1000010) in Play before publishing.

## Repeatable verification

The real SQLite instrumented tests use their own temporary databases. UI fixtures
exist solely in `wear/src/debug`; they are not Play purchase verification and must
never be included in a release. The UI script is restricted to a chosen emulator.

```sh
npm run test:wear-migration
cd android
./gradlew :wear:testDebugUnitTest :wear:assembleDebug :wear:assembleDebugAndroidTest -PwaterReminderSyncValidation=true
cd ..
adb -s WATCH_SERIAL install -r wear/build/outputs/apk/debug/wear-debug.apk
adb -s WATCH_SERIAL install -r -t wear/build/outputs/apk/androidTest/debug/wear-debug-androidTest.apk
adb -s WATCH_SERIAL shell am instrument -w com.shahab.waterreminder.syncvalidation.test/androidx.test.runner.AndroidJUnitRunner
python scripts/test-wear-ui.py --serial emulator-5554
```

The UI path was explored with ARTEMIS screen inspection and ADB before scripting.
The script uses fresh UIAutomator text/accessibility bounds, bounded waits, and
verified 384×384 coordinates as a fallback. An unavailable snapshot is retried,
not treated as fresh data.

For a paired production release with user-activated Plus, metric units and a
250 mL first preset, keep both devices unlocked and run:

```sh
python -m pip install uiautomator2
python scripts/test-wear-paired.py --phone PHONE_SERIAL --watch WATCH_SERIAL --offline --output paired-result.json
```

This script verifies phone-closed logging/undo, durable offline additions,
process restart and reconciliation. It undoes its drinks on success and restores
phone radios in `finally`; a failed run can leave test drinks for manual cleanup.
Do not manually log water during the run. Both serials must be selected explicitly;
use the watch IP or mDNS transport consistently when ADB lists it twice.

The Pixel 7 / Galaxy Watch4 production pair passed these checks with real test
account Plus, goal/units/presets/theme propagation, a live tile, a SHORT_TEXT
complication and 150% font-size layouts. Physical midnight/24-hour expiry,
extended battery use, TalkBack, RANGED_VALUE rendering, background Health Connect
and Play lifecycle/delivery remain release checks. The `features.wearOs.available`
marketing flag stays false until these checks and the Wear Play release are ready.
See [the verification report](quality/WEAR_OS_VERIFICATION.md) for evidence and limits.
