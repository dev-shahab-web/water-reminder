# Android Home-Screen Widgets

## Purpose

Water Reminder widgets let users glance at today's hydration progress and log common amounts from the Android home screen. They are an optional convenience surface, not a replacement for the app.

Widgets must preserve the core product principles: offline-first, privacy-first, calm, fast, and useful without accounts or cloud sync.

## Supported Platform

Widgets are Android-only.

The implementation uses Jetpack Glance through an Expo config plugin:

- `plugins/water-reminder-widget/withWaterReminderWidgets.js`
- `plugins/water-reminder-widget/android/`
- `src/modules/widgets/`
- `src/platform/widgets/`

Web and unsupported platforms use no-op widget refresh functions.

## User Experience

Widgets show:

- Today's consumed amount.
- Daily goal progress.
- Remaining amount.
- Goal completion state.
- Current streak context when space allows.
- Next reminder context when available.
- Quick-add actions for common water amounts.

Widget copy stays calm and short. It should never use urgency, guilt, or pressure.

## Data Flow

App state changes trigger `refreshHydrationWidgets`.

```txt
Hydration/settings/reminder/stat sync change
-> Persist mutation successfully
-> Reload canonical today state from SQLite/settings storage
-> Build a complete widget snapshot
-> Commit native-readable SharedPreferences snapshot
-> Copy snapshot into Glance preferences state
-> Request Jetpack Glance update
-> Android launcher widget
```

Widget quick-add uses the reverse path when React Native may not be running:

```txt
Launcher quick-add tap
-> Glance ActionCallback
-> Native SQLite insert
-> widget_actions idempotency record
-> Commit SQLite transaction
-> Recalculate today's consumed amount from SQLite
-> Commit native-readable SharedPreferences snapshot
-> Emit `widgetHydrationChanged` when React Native is alive
-> Copy snapshot into Glance preferences state
-> Request Jetpack Glance updateAll
```

The app remains the canonical experience. Widget writes use the same local SQLite database and appear in Home, History, Statistics, export, and delete/reset flows after app refresh. The widget snapshot is always rebuilt after the canonical write, never before it.

## Persistence

Hydration entries are stored in SQLite:

- Table: `hydration_entries`
- Source: `widget`
- Amount: milliliters
- Timestamp: ISO string

Processed widget actions are stored in SQLite:

- Table: `widget_actions`
- Purpose: duplicate prevention for launcher callbacks

The current widget snapshot is stored in Android SharedPreferences by the native module. This snapshot is display cache only; it is not the hydration source of truth.

Snapshot writes use synchronous commits so a launcher update request cannot overtake the new display state.
Before every launcher refresh, the native layer copies the durable snapshot into Glance `PreferencesGlanceStateDefinition` state. Widget composition reads from Glance `currentState`, not directly from SharedPreferences, so RemoteViews are rebuilt from observable widget state instead of a captured snapshot.

Snapshot writes are guarded by `updatedAt`. A stale projection may not overwrite a newer snapshot produced by a native widget action or a later app refresh.

## Refresh Triggers

Widgets refresh after:

- App bootstrap.
- Hydration log, edit, delete, undo, import, reset, and Health Connect sync.
- Goal, measurement unit, theme, and reminder preference changes.
- Native widget quick-add actions.

Refreshes are deduplicated in JavaScript so routine app renders do not reschedule widget work.
Refreshes caused by mutations are queued sequentially. If two changes happen quickly, each refresh rebuilds from canonical storage after the previous refresh completes so the final launcher state reflects the latest committed data.

When the running app returns to the foreground, it reloads today's hydration entries from SQLite, updates Redux, rebuilds the widget snapshot from canonical storage, and requests a widget refresh. Native widget quick-add also emits a lightweight `widgetHydrationChanged` event when the React Native runtime is alive so the Home screen can reload immediately without requiring app restart.

Before live sync reloads entries after a native widget action or foreground transition, React Native closes and reopens its Expo SQLite connection. This prevents the app from reading from a stale long-lived connection after the native widget writer has committed directly to SQLite.

## Design Rules

- Keep widgets glanceable.
- Prefer progress and one-tap logging over dense information.
- Use the native vector Water Reminder mark from the config-plugin template as the widget brand cue.
- Compact layouts may show only the brand mark; medium and expanded layouts may show the mark plus title or calm completion copy.
- Do not add social, streak-pressure, medical, advertising, or account concepts.
- Do not require network connectivity.
- Do not expose raw health data beyond the user's own local hydration progress.
- Use stable sizing and responsive layouts for compact, medium, and expanded widgets.
- Keep every Jetpack Glance `Row` and `Column` at 10 or fewer direct children. If a container needs more visual pieces, split it into nested rows/columns or remove spacer children.
- Prefer 6-8 direct children or fewer per Glance container. Use named sections such as header, progress, context, reminder, and quick actions so compact, medium, expanded, empty, and goal-complete states stay inside RemoteViews limits.
- Add lightweight structural guards when practical so future fixed-layout edits fail clearly during widget rendering instead of silently exceeding Glance limits.
- Keep the top-level widget layout simple enough that a rendering issue can fall back to a safe “Open app” state instead of leaving the launcher with “Can’t load widget.”

## Responsive Resizing

Water Reminder uses one responsive Android widget provider. The default target size is 2x2, and Pixel Launcher can resize the same widget horizontally and vertically.

Provider metadata must include:

- `resizeMode="horizontal|vertical"`
- `minWidth="110dp"`
- `minHeight="110dp"`
- `minResizeWidth="110dp"`
- `minResizeHeight="110dp"`
- `targetCellWidth="2"`
- `targetCellHeight="2"`
- `widgetCategory="home_screen"`

The Glance layout reads `LocalSize.current` and adapts:

- Compact: default 2x2 layout with brand, consumed amount, progress, and primary quick-add.
- Medium: widened layout with larger amount treatment, remaining amount, and additional quick-add.
- Expanded: widened and taller layout with streak/reminder context and the full quick-add set.

## Development Workflow

Widget native files are generated by Expo prebuild from the config plugin. Do not manually maintain generated Android widget files as the source of truth.

After widget plugin changes, run:

```sh
npx expo prebuild --platform android --clean
./gradlew :app:assembleDebug
```

Release verification should also run:

```sh
./gradlew :app:assembleRelease
```

## Testing Strategy

Covered in JavaScript tests:

- Widget amount formatting.
- Completion percentage clamping.
- Theme preference handling.

Manual Android verification:

- Add compact, medium, and expanded widgets.
- Confirm progress, remaining amount, and completion copy.
- Tap quick-add and confirm Home reflects the entry.
- Tap quick-add repeatedly and confirm no duplicate action from the same callback.
- Change daily goal, theme, unit, and reminders, then confirm widget refresh.
- Delete history/reset data and confirm widget state updates.
- Reboot or relaunch and confirm the widget remains stable.

Pixel Launcher validation:

- Install the signed release build on Pixel 7.
- Add the Water Reminder widget and confirm it renders without “Can’t load widget.”
- Long-press the widget and confirm Resize is available.
- Keep the default 2x2 size and confirm the compact layout.
- Widen the widget and confirm the medium layout.
- Widen and increase height, then confirm the expanded layout.
- Tap each visible quick-add button once and confirm exactly one hydration entry per tap.
- Restart the app and reboot the device, then confirm the widget still renders and refreshes from local state.

## Trade-Offs

The widget writes directly to SQLite for quick-add actions because Android launcher callbacks must work when the React Native bridge is not active. The trade-off is that the native writer must remain narrowly scoped and aligned with migrations. It may only insert hydration entries, record action idempotency, recalculate today's consumed amount from SQLite, and refresh the widget snapshot.

This keeps the widget fast and offline-first while avoiding a second business-logic layer.
