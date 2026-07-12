# Architecture

## Purpose

This document is the current architectural reference for Water Reminder. It describes the system as implemented after the product foundation, onboarding, Home logging loop, reminders, history, statistics, settings, and delight engine work.

Use this document before adding new product surfaces. Product decisions remain governed by [Product Principles](./PRODUCT_PRINCIPLES.md), [Anti-Goals](./ANTI_GOALS.md), and [Product Requirements](./PRODUCT_REQUIREMENTS.md).

## Architectural Principles

- Offline-first core usage.
- Local SQLite is the system of record for hydration entries.
- MMKV stores small preference and setup state.
- Expo Router owns navigation.
- Feature modules own product behavior.
- Platform adapters isolate native and infrastructure APIs.
- UI components stay thin and reusable.
- Business rules live in hooks, services, repositories, and utilities.
- Motion is centralized and respects Reduce Motion.
- No account, cloud sync, ads, social features, or backend dependency for core usage.

## App Layers

```txt
app/
  Expo Router route entry points

src/core/
  Bootstrap, providers, app shell, config, logging, root errors

src/platform/
  Native and infrastructure adapters

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

## Data Flow

### Logging Water

```txt
Home UI
-> useHomeHydration
-> Redux thunk logHydration
-> hydration-repository.addHydrationEntry
-> SQLite hydration_entries
-> Redux state updates today's entries
-> HydrationRing / metrics / timeline render
-> haptic feedback
```

Rules:

- Logging must feel immediate.
- SQLite remains the durable source of truth.
- UI should not block on network.
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

## SQLite Schema

Implemented table:

```sql
CREATE TABLE IF NOT EXISTS hydration_entries (
  id TEXT PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL CHECK (source IN ('quick_add', 'custom', 'edit')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hydration_entries_timestamp
  ON hydration_entries (timestamp);
```

Canonical rules:

- `amount` is stored in milliliters.
- `timestamp`, `createdAt`, and `updatedAt` are ISO strings.
- Local day grouping is derived in application utilities.
- Entry source is one of `quick_add`, `custom`, or `edit`.

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

| Key                                | Type    | Purpose                                                    |
| ---------------------------------- | ------- | ---------------------------------------------------------- |
| `reminderEnabled`                  | boolean | Whether reminders are enabled.                             |
| `reminderIntervalMinutes`          | number  | Interval: 30, 60, 90, 120, or 180.                         |
| `reminderWakeTime`                 | string  | Active start time, `HH:mm`.                                |
| `reminderSleepTime`                | string  | Active end time, `HH:mm`.                                  |
| `reminderTimezone`                 | string  | Last known timezone.                                       |
| `reminderPausedUntil`              | string  | ISO pause end time.                                        |
| `reminderScheduledNotificationIds` | string  | JSON array of Expo notification ids.                       |
| `reminderLastScheduleSignature`    | string  | Last schedule signature to avoid unnecessary rescheduling. |

Settings:

| Key                       | Type    | Purpose                                 |
| ------------------------- | ------- | --------------------------------------- |
| `settingsMeasurementUnit` | string  | `ml` or `oz`.                           |
| `settingsThemePreference` | string  | `system`, `light`, or `dark`.           |
| `settingsReduceMotion`    | boolean | Product-level reduce motion preference. |
| `settingsStartOfDay`      | string  | Start-of-day preference, `HH:mm`.       |

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
-> build schedule signature
-> cancel previous scheduled ids if needed
-> calculateReminderSchedule
-> scheduleLocalNotification
-> persist scheduled ids
```

Notification tap flow:

```txt
Expo notification response
-> AppShell listener
-> router.replace("/")
-> reminderPulse param
-> HydrationRing subtle ripple
```

Reminder rules:

- Local notifications only.
- No backend.
- No cloud.
- No account.
- Do not schedule outside active hours.
- Do not remind after goal completion.
- Do not remind while paused or disabled.
- Use calm copy only.

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

Future Health Connect support should be additive and optional.

Recommended shape:

```txt
src/platform/health/
src/modules/health-connect/
```

Integration rules:

- Do not make Health Connect required for core tracking.
- Ask permission only after explaining value.
- Keep SQLite hydration entries locally authoritative.
- Treat imported health data as a separate source until product rules define merging.
- Never silently export hydration logs.
- Add clear conflict and deduplication rules before implementation.

Likely source additions:

- New platform adapter for Health Connect permissions/read/write.
- New module service for import/export policy.
- New repository fields or table only after schema review.

### Widgets

Future widgets should be additive retention surfaces, not a separate product.

Recommended shape:

```txt
src/platform/widgets/
src/modules/widgets/
```

Integration rules:

- Widget should show today progress and quick add only if platform-safe.
- Widget data should be derived from local state.
- Widget actions must preserve offline-first behavior.
- Do not require account, cloud sync, or network.
- Keep widget copy calm and non-guilt-based.

Likely source additions:

- Platform widget adapter.
- Shared serialization of today summary.
- Widget refresh service triggered after log/edit/delete and goal changes.

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
