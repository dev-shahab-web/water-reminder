# Architecture

## Purpose

This document is the current architectural reference for Water Reminder. It describes the system as implemented after the product foundation, onboarding, Home logging loop, reminders, history, statistics, settings, delight engine, optional Android Health Connect work, widgets, and privacy-safe Firebase telemetry.

Use this document before adding new product surfaces. Product decisions remain governed by [Product Principles](./PRODUCT_PRINCIPLES.md), [Anti-Goals](./ANTI_GOALS.md), and [Product Requirements](./PRODUCT_REQUIREMENTS.md).

## Architectural Principles

- Offline-first core usage.
- Local SQLite is the system of record for hydration entries.
- MMKV stores small preference and setup state.
- Expo Router owns navigation.
- Feature modules own product behavior.
- Platform adapters isolate native and infrastructure APIs.
- Health data integrations are optional adapters, never core dependencies.
- Telemetry is optional, sanitized, and never a source of product state.
- UI components stay thin and reusable.
- Business rules live in hooks, services, repositories, and utilities.
- Motion is centralized and respects Reduce Motion.
- Material Community Icons through React Native Paper are the single app icon system.
- Brand identity is water-led: calm glass, reflection, flow, and restrained teal/aqua accents.
- No account, cloud sync, ads, social features, or backend dependency for core usage.

## App Layers

```txt
app/
  Expo Router route entry points

src/core/
  Bootstrap, providers, app shell, config, logging, root errors

src/platform/
  Native and infrastructure adapters, including telemetry

src/shared/
  Design system components, theme, motion, shared types

src/modules/
  Product feature modules

src/state/
  Redux Toolkit store

src/query/
  React Query client
```

Dependency direction:

```txt
Route
-> Module Screen
-> Module Hook
-> Module Service / Repository / Utility
-> Platform Adapter
```

Rules:

- Routes should remain thin.
- Screens should not access SQLite, MMKV, Expo Notifications, or haptics directly.
- Feature modules should not import sibling internals unless a public module export exists.
- Shared components should not contain product-specific business rules.
- Platform adapters should not know about UI.
- Firebase SDKs must only be called from `src/platform/telemetry`.

## Bootstrap And Providers

Entry:

```txt
app/_layout.tsx
-> AppRoot
-> GestureHandlerRootView
-> AppProviders
-> ApplicationBootstrap
-> AppShell
```

Provider order:

```txt
Redux Provider
-> React Query Provider
-> Paper Provider
-> Expo Router ThemeProvider
-> Expo Router Stack
```

Important files:

- `src/core/bootstrap/app-root.tsx`
- `src/core/bootstrap/app-providers.tsx`
- `src/core/bootstrap/application-bootstrap.tsx`
- `src/core/bootstrap/app-shell.tsx`

Bootstrap initializes:

- MMKV storage.
- SQLite database and migrations.
- Expo Notifications handler/channel.
- System UI background color.
- Notification response listener.

Theme resolution:

- Settings stores `system`, `light`, or `dark`.
- `AppProviders` subscribes to settings via `useSyncExternalStore`.
- Theme snapshots must remain referentially stable to avoid provider render loops.

## Navigation Map

Routes:

```txt
/
/history
/statistics
/settings
/onboarding
/onboarding/goal
/onboarding/reminders
```

Primary flows:

```txt
First launch
-> /onboarding
-> /onboarding/goal
-> /onboarding/reminders
-> /

Returning user
-> /

Home
-> /history
-> /statistics
-> /settings

Notification tap
-> /
-> Home progress attention ripple
```

Navigation rules:

- Expo Router owns routing.
- Do not manually create a React Navigation `NavigationContainer`.
- Completed users should not see onboarding again.
- Home remains the primary product surface.
- Top-level secondary screens use a shared RTL-aware icon back button instead of text-only navigation buttons.

## Brand And Design System

Brand direction:

- Calm, pure, minimal, premium, trustworthy.
- Water-inspired rather than generically blue.
- Visual cues should come from flow, reflection, transparency, and gentle motion.

The editable brand source remains `assets/branding/source/master-logo.svg`. Runtime app raster assets live under `assets/branding/app/`, store-only graphics live under `assets/branding/store/`, repository artwork lives under `assets/branding/github/`, and widget branding uses the config-plugin drawable template under `plugins/water-reminder-widget/android/res/drawable/`.

Design tokens live in `src/shared/theme/tokens/` and are surfaced through `AppTheme`. Product screens should use theme tokens for color, spacing, radius, typography, and elevation instead of local one-off values.

Glass treatment is intentionally selective:

- Home hero and important cards may use translucent-feeling surfaces, soft borders, low elevation, and subtle reflection.
- Routine form rows remain clear and quiet.
- Avoid heavy gradients, bright decorative color, and ornamental background shapes.

## Release Links

Release-facing destinations live in `src/core/config/release-links.ts`.

Supported environment overrides:

- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EXPO_PUBLIC_GITHUB_URL`
- `EXPO_PUBLIC_FEEDBACK_EMAIL`
- `EXPO_PUBLIC_PLAY_STORE_URL`
- `EXPO_PUBLIC_LICENSES_URL`

Settings uses these values for Privacy, Terms, GitHub, Feedback, Rate App, and Open Source Licenses. Empty values fall back to local, production-safe placeholder copy instead of broken links.

For Play publication, configure HTTPS privacy and terms URLs before submission. GitHub stays hidden when `EXPO_PUBLIC_GITHUB_URL` is empty.

## Publication Readiness References

Release-facing source-of-truth documents:

- [Production Config Audit](./release/PRODUCTION_CONFIG_AUDIT.md)
- [Firebase Release Verification](./release/FIREBASE_RELEASE_VERIFICATION.md)
- [Data Safety Guidance](./compliance/DATA_SAFETY.md)
- [Health Apps Declaration](./compliance/HEALTH_APPS_DECLARATION.md)
- [Health Connect Declaration](./compliance/HEALTH_CONNECT_DECLARATION.md)
- [Permissions Audit](./compliance/PERMISSIONS_AUDIT.md)
- [Play Console App Content](./compliance/PLAY_CONSOLE_APP_CONTENT.md)
- [Release QA](./release/RELEASE_QA.md)

Current release assumptions:

- Package ID: `com.shahab.waterreminder`.
- Version name: `1.0.0`.
- Minimum SDK: 28.
- Target SDK: 36.
- Compile SDK: 36.
- Core hydration storage: local SQLite.
- Preferences and setup state: MMKV/local preferences.
- Optional telemetry: Firebase Analytics and Crashlytics through `src/platform/telemetry`, diagnostics default off.

## Icon System

Water Reminder uses one icon system:

```txt
React Native Paper Icon / IconButton
-> Material Community Icons
```

Shared surfaces:

- `src/shared/components/icon-button.tsx` for circular icon-only actions.
- `PrimaryButton` and `SecondaryButton` support optional leading icons for semantic actions.
- `SettingsRow` supports optional leading icons for scannable settings groups.

Rules:

- Use familiar platform icons for back, settings, edit, delete, history, statistics, notifications, sync, export, import, privacy, feedback, and rating.
- Keep icon-only controls at roughly 48dp touch targets.
- Always provide accessible labels for icon-only buttons.
- Do not mix Lucide, Expo vector icons, custom SVG icons, and Paper icons in the app UI.

## Motion Architecture

Shared motion helpers live in `src/shared/motion/`.

Important pieces:

- `motion-tokens.ts` defines short, calm timing constants.
- `motion-preferences.ts` gates continuous motion by Reduce Motion, app active state, and screen focus.
- `AnimatedCard`, `AnimatedCounter`, and `AnimatedPressableScale` provide reusable motion primitives.

Motion rules:

- Logging feedback remains immediate and under the approved response window.
- Continuous Home water motion runs on Reanimated shared values, not React state.
- Continuous motion pauses when Home is unfocused, the app is backgrounded, or Reduce Motion is enabled.
- Reduce Motion preserves state clarity while disabling looping water movement and expanding ripples.
- Avoid adding heavy animation/rendering dependencies unless a product requirement genuinely needs them.

## Home Hero Implementation

The Home dashboard is the primary product surface.

Hero structure:

```txt
Glass hero card
-> Brand mark, app name, dynamic greeting, settings icon
-> HydrationRing
-> Today / Remaining / Goal metric row
```

`HydrationRing` owns only visual progress presentation:

- Reanimated progress value tied to the current daily total.
- Continuous water-surface motion gated by motion preferences.
- Separate one-shot ripple animation for logging/reminder attention.
- Completion glow for daily goal completion.
- Accessible progressbar labels and values.

Business logic remains outside the visual component in hydration hooks, Redux state, and SQLite repositories.

## Feature Modules

### Onboarding

Path:

```txt
src/modules/onboarding/
```

Responsibilities:

- First-launch setup state.
- Default hydration goal.
- Goal validation and clamping.
- Reminder preference result from onboarding.

Persistence:

- MMKV through `onboarding-storage.ts`.

### Hydration

Path:

```txt
src/modules/hydration/
```

Responsibilities:

- Home dashboard hydration state.
- Quick add and custom amount logging.
- Edit, delete, and undo recent log.
- Today timeline.
- History screen and day navigation.
- Hydration entry repository.

State:

- Redux Toolkit slice owns today's in-memory entries.
- SQLite repository owns durable entries.

### Reminders

Path:

```txt
src/modules/reminders/
```

Responsibilities:

- Reminder preferences.
- Local reminder scheduling.
- Active hours.
- Interval changes.
- Pause/resume.
- Status and preview copy.

Platform:

- Expo Notifications through `src/platform/notifications`.

### Statistics

Path:

```txt
src/modules/statistics/
```

Responsibilities:

- Weekly totals.
- Monthly heatmap.
- Streak calculations.
- Local insights.
- Statistics preview for Home.

Data:

- Reads SQLite aggregates through `statistics-repository.ts`.
- Statistics are derived from hydration entries, not stored separately.

### Settings

Path:

```txt
src/modules/settings/
```

Responsibilities:

- Goal, unit, start of day, theme, reduce motion.
- Reminder management surface.
- Local data summary.
- Local JSON export/import.
- Reset and delete history confirmations.
- About information.

Persistence:

- MMKV for preferences.
- SQLite repository helpers for hydration data management.

### Health Connect

Path:

```txt
src/modules/health-connect/
src/platform/health/
```

Responsibilities:

- Android Health Connect availability detection.
- Explicit hydration-only permission request flow.
- Manual and initial hydration synchronization.
- Home pull-to-refresh reconciliation.
- Best-effort automatic sync after local hydration mutations.
- Writing local Water Reminder logs to Health Connect.
- Importing external hydration records into local SQLite.
- Duplicate prevention through Health Connect record and client ids.
- Last sync status and recoverable error metadata.
- Settings integration.

Persistence:

- SQLite stores imported hydration entries and source metadata.
- MMKV stores sync status metadata only.

Rules:

- Health Connect is optional and Android-only.
- Web and unsupported platforms return a typed unsupported state.
- Core hydration tracking must continue without Health Connect.
- Only hydration read/write permissions are requested.
- Health data is never sent to a backend.

### Telemetry

Path:

```txt
src/platform/telemetry/
```

Responsibilities:

- Provider-agnostic telemetry API.
- Firebase Analytics and Crashlytics isolation.
- Consent persistence for anonymous diagnostics.
- Strict event and parameter allowlists.
- Screen route sanitization.
- Safe handled-error categories.

Rules:

- Telemetry is off by default.
- Settings controls `Share anonymous diagnostics`.
- UI and business modules must not call Firebase SDKs directly.
- Hydration values, goals, history, timestamps, Health Connect records, reminder schedules, exported/imported content, SQL, filenames, user-entered text, and account identifiers are prohibited.
- Telemetry failures must never affect Redux, SQLite, widgets, reminders, Health Connect, or UI flows.
- Firebase Authentication, Firestore, Remote Config, Performance Monitoring, Cloud Messaging, and Ads are not part of this architecture.

## Data Flow

### Logging Water

```txt
Home UI
-> useHomeHydration
-> Redux thunk logHydration
-> hydration-repository.addHydrationEntry
-> SQLite hydration_entries
-> Redux state updates today's entries
-> queue best-effort Health Connect sync if connected
-> HydrationRing / metrics / timeline render
-> haptic feedback
```

Rules:

- Logging must feel immediate.
- SQLite remains the durable source of truth.
- UI should not block on network.
- Health Connect sync is non-blocking and must not roll back local logging.
- Haptics are enhancement-only and must fail silently.

### Loading Today

```txt
Home mounts
-> useHomeHydration
-> loadTodayHydration thunk
-> getTodayHydrationEntries
-> SQLite date-bound query
-> Redux hydration.entries
```

### Home Pull-To-Refresh

```txt
Home pull gesture
-> RefreshControl
-> useHomeHydration.refreshHome
-> refreshHomeHydration thunk
-> awaitDatabaseReady
-> getTodayHydrationEntries
-> syncHealthConnectIfConnected
-> getTodayHydrationEntries
-> Redux hydration.entries replace canonical result
-> refreshHydrationWidgets
-> useReminders observes updated total and reconciles reminders
-> useStatisticsPreview reloads compact Home preview
```

Rules:

- SQLite remains the canonical local source of truth before and after Health Connect sync.
- Pull-to-refresh works even when Health Connect is unavailable, unsupported, or disconnected.
- Health Connect sync failures show calm copy and keep refreshed local data visible.
- The refresh indicator is owned by Home UI state and always ends in `finally`.
- Widget refresh happens after the post-sync canonical SQLite reload.

### History

```txt
History route
-> useHydrationHistory
-> hydration repository by selected local date
-> local summary calculation
-> History screen
```

### Statistics

```txt
Statistics route
-> useStatisticsDashboard
-> statistics service
-> statistics repository aggregate queries
-> calculation utilities
-> charts, cards, insights
```

### Settings

```txt
Settings route
-> useSettings
-> MMKV settings storage
-> onboarding goal storage
-> reminder hook
-> hydration data service
```

### Health Connect Sync

```txt
Settings
-> HealthConnectCard
-> useHealthConnect
-> health-connect-sync-service
-> platform healthDataService
-> Health Connect native SDK on Android
```

Sync policy:

- User action is required before requesting permission.
- Local entries with `quick_add`, `custom`, or `edit` sources are written when not yet synced.
- Imported records are stored with `source = health_connect`.
- Duplicate prevention checks Health Connect record id, client record id, and local id.
- Initial sync reads the previous 365 days.
- Incremental sync reads from the last successful sync with a one-day overlap.
- Settings sync, Home pull-to-refresh, and automatic mutation follow-up sync all reuse the same serialized sync lock.
- Automatic mutation follow-up sync is best-effort and coalesces rapid local changes.
- Health Connect failures never block local hydration logging.
- Last sync status and error copy are stored in MMKV for explainability.

## SQLite Schema

Implemented table:

```sql
CREATE TABLE IF NOT EXISTS hydration_entries (
  id TEXT PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL CHECK (source IN ('quick_add', 'custom', 'edit', 'health_connect', 'widget')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  healthConnectRecordId TEXT UNIQUE,
  healthConnectClientRecordId TEXT UNIQUE,
  healthConnectDataOrigin TEXT,
  healthConnectSyncedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_hydration_entries_timestamp
  ON hydration_entries (timestamp);

CREATE INDEX IF NOT EXISTS idx_hydration_entries_health_connect_record
  ON hydration_entries (healthConnectRecordId);

CREATE INDEX IF NOT EXISTS idx_hydration_entries_health_connect_client_record
  ON hydration_entries (healthConnectClientRecordId);

CREATE TABLE IF NOT EXISTS widget_actions (
  actionId TEXT PRIMARY KEY NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  createdAt TEXT NOT NULL
);
```

Canonical rules:

- `amount` is stored in milliliters.
- `timestamp`, `createdAt`, and `updatedAt` are ISO strings.
- Local day grouping is derived in application utilities.
- Entry source is one of `quick_add`, `custom`, `edit`, `health_connect`, or `widget`.
- `widget_actions` stores processed widget action ids so home-screen quick-add taps are idempotent.
- `healthConnectRecordId` identifies a Health Connect record imported from or written to Android Health Connect.
- `healthConnectClientRecordId` stores the local client id used for duplicate prevention.
- `healthConnectDataOrigin` records the origin package when Health Connect provides it.
- `healthConnectSyncedAt` records the last local sync time for explainability.

Database files:

- `src/platform/database/database-service.native.ts`
- `src/platform/database/database-service.web.ts`
- `src/platform/database/migrations.ts`
- `src/modules/hydration/repository/hydration-repository.ts`
- `src/modules/statistics/repository/statistics-repository.ts`

Web note:

- Expo SQLite web depends on a `wa-sqlite.wasm` asset.
- `metro.config.js` adds `wasm` to Metro asset extensions.

## MMKV Keys

Storage instance:

```txt
id: rn-enterprise-starter
```

Onboarding:

| Key                   | Type    | Purpose                           |
| --------------------- | ------- | --------------------------------- |
| `onboardingCompleted` | boolean | Whether onboarding is complete.   |
| `hydrationGoal`       | number  | Daily goal in milliliters.        |
| `reminderPreference`  | string  | `manual`, `enabled`, or `denied`. |

Reminders:

| Key                                 | Type    | Purpose                                                              |
| ----------------------------------- | ------- | -------------------------------------------------------------------- |
| `reminderEnabled`                   | boolean | Whether reminders are enabled.                                       |
| `reminderActiveModeDefaultsApplied` | boolean | Whether the one-time Active-mode vibration default has been applied. |
| `reminderIntervalMinutes`           | number  | Interval: 30, 60, 90, 120, or 180.                                   |
| `reminderWakeTime`                  | string  | Active start time, `HH:mm`.                                          |
| `reminderSleepTime`                 | string  | Active end time, `HH:mm`.                                            |
| `reminderTimezone`                  | string  | Last known timezone.                                                 |
| `reminderPausedUntil`               | string  | ISO pause end time.                                                  |
| `reminderScheduledNotificationIds`  | string  | JSON array of Expo notification ids.                                 |
| `reminderLastScheduleSignature`     | string  | Last schedule signature to avoid unnecessary rescheduling.           |

Settings:

| Key                                 | Type    | Purpose                                                         |
| ----------------------------------- | ------- | --------------------------------------------------------------- |
| `settingsMeasurementUnit`           | string  | `ml` or `oz`.                                                   |
| `settingsThemePreference`           | string  | `system`, `light`, or `dark`.                                   |
| `settingsReduceMotion`              | boolean | Product-level reduce motion preference.                         |
| `settingsStartOfDay`                | string  | Start-of-day preference, `HH:mm`.                               |
| `settingsShareAnonymousDiagnostics` | boolean | User consent for Firebase Analytics and Crashlytics collection. |

Telemetry:

| Key                                  | Type    | Purpose                            |
| ------------------------------------ | ------- | ---------------------------------- |
| `telemetryShareAnonymousDiagnostics` | boolean | Platform telemetry consent mirror. |

Health Connect:

| Key                           | Type   | Purpose                                   |
| ----------------------------- | ------ | ----------------------------------------- |
| `healthConnectLastError`      | string | Last recoverable sync error message.      |
| `healthConnectLastSyncIso`    | string | Last successful sync timestamp.           |
| `healthConnectLastSyncStatus` | string | `idle`, `syncing`, `success`, or `error`. |

MMKV rules:

- Store only small setup and preference values.
- Do not store hydration logs in MMKV.
- Validate every value read from storage.
- Expose stable snapshots for `useSyncExternalStore`.

## Notification Flow

Platform adapter:

```txt
src/platform/notifications/notification-service.ts
```

Reminder engine:

```txt
src/modules/reminders/services/reminder-engine.ts
```

Scheduling flow:

```txt
Reminder preference changes
-> updateReminderSchedulePreference / enableReminders / pauseReminders
-> reconcileReminderSchedule
-> serialize base schedule reconciliation
-> read canonical reminder preferences and abort stale requests
-> inspect Expo's scheduled notification queue
-> cancel stale, legacy, duplicate, or mismatched hydration reminders
-> build schedule signature
-> cancel previous scheduled ids if needed
-> calculateReminderSchedule
-> reminder notification factory
-> scheduleLocalNotification
-> persist scheduled ids
```

Notification tap flow:

```txt
Expo notification response
-> AppShell listener
-> reminder action service
-> open Home / Drink / Snooze / Dismiss
```

Drink action flow:

```txt
Reminder action service
-> occurrence idempotency check
-> hydration log thunk
-> SQLite
-> Redux
-> widget refresh
-> Health Connect best-effort sync
-> reload today's entries
-> reconcile reminders
-> dismiss notification
```

Snooze action flow:

```txt
Reminder action service
-> snooze manager
-> cancel previous pending snooze
-> schedule hydration-snooze-v1 one-off notification
-> persist pending snooze id
-> dismiss notification
```

Snooze is configured as a non-foreground notification action where Expo can deliver the response to JavaScript. Drink may foreground the app for reliability; Dismiss never foregrounds. A killed-process, fully headless Snooze guarantee would require an approved native Android receiver.

Reminder rules:

- Local notifications only.
- No backend.
- No cloud.
- No account.
- Do not schedule outside active hours.
- Do not remind after goal completion.
- Do not remind while paused or disabled.
- Use calm copy only.
- Gentle mode is default and silent.
- Active mode uses system-default sound and default importance.
- Active mode applies the vibration default once, then preserves explicit user changes.
- Snooze is one-off and never mutates the base schedule.
- Snoozed reminders use `hydration-snooze-v1`; base Gentle uses `hydration-gentle-v1`; base Active uses `hydration-active-v1`.
- Test reminders use `source: test`, a stable `hydration-reminder-test` identifier, and the current effective reminder mode channel.
- Vibration and Enable Snooze are controlled preferences with one switch handler each. Schedule reconciliation may update schedule-owned fields, but it must not overwrite these UI-owned booleans from stale async results.
- Notification action data uses versioned metadata and never includes hydration amounts, schedules, goals, Health Connect identifiers, or user identifiers.

## Home Interaction Surfaces

Home remains the fast habit loop, not a settings dashboard.

- Quick Add presets are stored in MMKV as small preference-style configuration.
- Default presets are 250 ml, 500 ml, and 750 ml.
- Presets have stable ids, preserve user order, validate 50-5,000 ml, reject duplicates, and keep at least one preset.
- Preset management lives in `/quick-add-presets`.
- Today's activity on Home is a horizontal recent-entry strip limited to recent items; full history remains on the History screen.
- Detailed reminder configuration lives in `/settings/reminders`; Home renders only a compact reminder summary with pause/resume and settings shortcuts.

## Motion System

Path:

```txt
src/shared/motion/
```

Current primitives:

- `AnimatedCard`
- `AnimatedCounter`
- `AnimatedPressableScale`
- `EmptyState`
- `SkeletonCard`
- `motionDuration`
- `getMotionDuration`

Motion principles:

- Motion communicates state, feedback, hierarchy, completion, and direction.
- Routine interactions should finish in roughly 200-300ms.
- Motion must not block logging.
- Reduce Motion must be respected.
- Avoid bounce, elastic motion, looping decoration, or spectacle.

Signature Home moment:

```txt
Quick Add
-> haptic success
-> water rises
-> ripple expands
-> ring updates
-> counter animates
-> warm microcopy
```

Use shared motion primitives before adding one-off animations.

## Haptics

Path:

```txt
src/platform/haptics/haptic-service.ts
```

Current haptic events:

- Water logged.
- Goal complete.
- Error.
- Delete confirmation.
- Reminder pause.

Rules:

- Haptics are meaningful only.
- Haptics must never be the only feedback.
- Platform unavailability must fail silently.
- Do not add haptics for passive loading, scrolling, or every navigation tap.

## Theme And Design System

Theme files:

```txt
src/shared/theme/
src/shared/theme/tokens/
```

Shared components:

```txt
src/shared/components/
```

Rules:

- Use semantic theme values.
- Avoid hardcoded product colors in screens.
- Use shared buttons, cards, empty states, skeletons, and motion primitives where possible.
- Keep Home progress visually dominant.
- Ensure large text and screen readers remain supported.

## Testing Strategy

Commands:

```txt
npm run lint
npm run typecheck
npm test
npx expo-doctor
npm run android
```

Current test focus:

- Theme token mapping.
- Onboarding goal validation.
- Hydration summary calculations.
- Date utilities.
- Reminder schedule calculation.
- Statistics calculations and insights.
- Settings storage, settings utilities, data service formatting.
- Motion token constraints.

Testing rules:

- Add unit tests for deterministic utilities and storage parsing.
- Keep platform SDK behavior behind adapters so it can be mocked.
- Prefer repository/service tests for data-heavy behavior.
- Avoid testing animation frames directly unless behavior depends on them.
- Run typecheck and lint for every sprint.

Environment limitations:

- `npx expo-doctor` may require network access to the npm registry.
- Android installation requires ADB permissions and a connected emulator/device.

## Folder Conventions

Feature module shape:

```txt
src/modules/example/
  components/
  hooks/
  screens/
  services/
  repository/
  storage/
  state/
  types/
  utils/
```

Use only folders that are needed.

Guidelines:

- `components/`: reusable feature UI.
- `screens/`: route-level product surfaces.
- `hooks/`: UI orchestration and state composition.
- `services/`: business workflows.
- `repository/`: SQLite access and durable product data.
- `storage/`: MMKV preference storage.
- `state/`: Redux slices and thunks.
- `types/`: module-owned TypeScript types.
- `utils/`: deterministic pure helpers.

Public module exports:

- Export stable module APIs through `index.ts`.
- Avoid importing deep internals from another module unless there is no public boundary yet and the dependency is intentionally reviewed.

## Extension Points

### Health Connect

Health Connect support is implemented as an optional Android integration.

Current shape:

```txt
src/platform/health/
src/modules/health-connect/
```

Integration rules:

- Do not make Health Connect required for core tracking.
- Ask permission only after explaining value.
- Keep SQLite hydration entries locally authoritative.
- Treat imported health data as a separate `health_connect` source.
- Never silently export hydration logs.
- Do not request broad health permissions.
- Keep Health Connect native types behind `src/platform/health`.
- Do not scatter generated Android changes when a config plugin can express the requirement.

Extension points:

- Add conflict resolution before supporting Health Connect record updates or deletes.
- Add HealthKit behind the same `HealthDataService` interface if iOS health sync is approved.

### Widgets

Android home-screen widgets are implemented as an additive retention surface, not a separate product.

Current shape:

```txt
src/platform/widgets/
src/modules/widgets/
plugins/water-reminder-widget/
```

Integration rules:

- Widgets show today progress, remaining amount, streak context, reminder context, and quick-add actions.
- Widget data is derived from local SQLite, MMKV settings, and reminder preferences through `refreshHydrationWidgets`.
- Widget actions preserve offline-first behavior by writing directly to the local SQLite database when React Native is not running.
- Do not require account, cloud sync, or network.
- Keep widget copy calm and non-guilt-based.
- Treat widget logs as `source = 'widget'`.
- Deduplicate quick-add taps through `widget_actions`.
- Express Android native registration, Glance dependencies, resources, and React Native package wiring through the Expo config plugin.

Implementation pieces:

- `src/modules/widgets/services/widget-state-builder.ts` builds the serializable widget snapshot.
- `src/modules/widgets/services/widget-refresh-coordinator.ts` writes the snapshot and asks Android to refresh widgets.
- `src/platform/widgets/widget-native-module.ts` is the platform boundary for native widget refresh.
- `plugins/water-reminder-widget/` owns Jetpack Glance widget templates and the config plugin that regenerates native Android files.
- Native widget quick-add inserts into `hydration_entries` and updates the widget snapshot without requiring network or an active React Native bridge.

## Change Guidance

Before adding a feature:

- Confirm it aligns with Product Principles and Anti-Goals.
- Decide whether state belongs in SQLite, MMKV, Redux, React Query, or local component state.
- Keep the route thin.
- Add service/repository boundaries before UI grows complex.
- Add tests around pure logic and persistence parsing.
- Reuse motion and shared components.
- Preserve Home performance and the two-second logging loop.

Do not change platform architecture unless a product requirement reveals a real limitation.
