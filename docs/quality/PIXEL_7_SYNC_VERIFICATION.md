# Pixel 7 hydration sync verification — October 8, 2026

Physical Pixel 7, Android release build 2.0.1 (7), Asia/Kolkata.
Installed with `adb install -r`; no uninstall or app-data reset.
`android.enableMinifyInReleaseBuilds=true` and R8 ran successfully.

## Reproduced before the fix

Home showed 250 in the ring but 38% complete / 1250 ml remaining.
JavaScript widget refresh logged 750 ml while native reconciliation logged
250 ml. A fresh 500 ml app addition reproduced this disagreement; restarting
the process returned to 250 ml.

The widget used Android's SQLite while Expo used its bundled SQLite engine
against the same WAL file, in the same process. Separate SQLite libraries
do not share the connection/locking bookkeeping:
[SQLite documentation](https://www.sqlite.org/howtocorrupt.html#multiple_copies_of_sqlite_linked_into_the_same_application).

## Implementation

- WidgetDatabase uses the same expo-sqlite native bindings as the app, including
  prepared binding, statement finalization, WAL and a busy timeout.
- Both widget reconciliation/writes and the Health Connect worker use it.
- The ring renders the committed amount as React Text, avoiding the stale
  animated TextInput text/defaultValue.
- Keep template and generated native sources in sync. The adapter uses internal
  bindings from the pinned expo-sqlite version: recheck compilation and a
  minified-device add/restart/widget test whenever upgrading Expo.

## Device checks

- App +500 ml: Home and widget reached 750 ml; a full process restart retained
  750 ml and the correct 38% / 1250 ml remaining.
- Hydration read/write permission was enabled with user approval. Health
  Connect showed exactly today's existing 250 ml and test 500 ml records.
- Killed the background app process, verified no PID, then widget +750 ml:
  native total 1500 ml and native Health Connect worker SUCCESS. Before
  reopening the app, Health Connect showed the additional 0.75 L record.
- Reopening Home and History showed 1500 ml and exactly three entries.
- Edited the test widget drink from 750 to 237 ml: native and JavaScript totals
  reached 987 ml. Health Connect replaced 0.75 L with 0.237 L, without duplicates.
- Deleted only the two test drinks (237 ml and 500 ml) through History, with
  each confirmation checked. History, widget and Health Connect returned to
  today's original 250 ml record. Deleted test drinks can be re-added manually.
- Final force-stop/restart and foreground Health Connect sync still showed
  250 ml in both JavaScript/native logs and Home; test drinks were not reimported.

## Automated checks

- Jest: 42 suites, 227 tests passed, including ring rerender/add/remove and unit
  changes.
- Real SQLite repository checks passed: edits, stale acknowledgements,
  durable removals, import suppression, ownership, restore.
- ESLint and Prettier passed for the changed ring and regression tests.
- Typecheck is blocked only by three existing errors in
  `src/shared/motion/motion-provider.test.tsx`.

Accessibility hierarchy dumps intermittently returned a null root on this
phone (including Android Health Connect). Screenshots and runtime logs were
used to verify those screens; stale hierarchy files were not used as evidence.
