# Platform Audit

## Summary

The Milestone 3 platform foundation is architecturally sound for extension. The current implementation keeps provider composition, bootstrap, platform services, state, query, theme, and logging in separate folders with stable boundaries.

## Extension Questions

| Area          | Future Replacement                    | Answer     | Reason                                                                                                                                       |
| ------------- | ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap     | Firebase or other SDK initialization  | Yes        | Bootstrap already centralizes startup in `ApplicationBootstrap`; new SDK initializers can be added without changing route files or features. |
| Logging       | Crashlytics, Sentry, Azure App Center | Yes        | Code imports `@core/logger`, not vendor SDKs. The logger implementation can fan out to external sinks later.                                 |
| Storage       | Encrypted Storage or SecureStore      | Yes        | MMKV is isolated behind `src/platform/storage`; consumers depend on `KeyValueStorage`, not MMKV directly.                                    |
| Database      | Realm or another local database       | Mostly yes | SQLite is isolated behind `src/platform/database`. Future repositories should avoid leaking `SQLiteDatabase` types to keep replacement easy. |
| Notifications | Native notifications                  | Yes        | Expo Notifications is isolated behind `src/platform/notifications`; modules should use typed platform APIs only.                             |

## Architectural Audit

The current foundation follows the approved architecture:

- `app/` remains thin and delegates to `@core/bootstrap`.
- `src/core` owns bootstrap, errors, logging, config, and env.
- `src/platform` owns MMKV, SQLite, and notification SDK access.
- `src/shared/theme` owns tokens and light/dark themes.
- `src/state` owns Redux Toolkit store initialization.
- `src/query` owns TanStack Query initialization.
- `src/modules` remains empty except for the placeholder playground directory.

No business feature, Water Reminder implementation, reusable business component, or application table has been added.

## Dependency Direction Audit

Current direction:

```txt
app -> core -> platform/shared/query/state
platform -> vendor SDKs
shared/theme -> React Native Paper + React Navigation theme types
state -> Redux Toolkit
query -> TanStack Query
```

Allowed vendor SDK imports are currently limited to their owning layers:

- `expo-sqlite` only in `src/platform/database`
- `expo-notifications` only in `src/platform/notifications`
- `react-native-mmkv` only in `src/platform/storage`
- `@reduxjs/toolkit` only in `src/state`
- `@tanstack/react-query` in `src/query` and provider composition

No feature module imports platform SDKs directly.

## Provider Hierarchy Review

The provider tree is intentionally shallow:

```txt
GestureHandlerRootView
  ReduxProvider
    QueryClientProvider
      PaperProvider
        Navigation ThemeProvider
          ApplicationBootstrap
            AppShell
```

This hierarchy is acceptable because:

- Redux is available to future Query integrations if needed.
- Query is available before app screens render.
- Paper and navigation themes are aligned.
- Bootstrap can use themed loading state while initializing platform services.
- The app shell remains focused on navigation and status bar.

## Bootstrap Lifecycle Review

Current bootstrap:

1. Prevent splash auto-hide.
2. Initialize MMKV.
3. Initialize SQLite.
4. Initialize notification registration.
5. Log success or failure.
6. Hide splash.
7. Render shell.

This is extensible for Firebase, analytics, remote config, crash reporting, and other SDKs. New startup work should be added through small platform/core initializer functions, not inline business logic.

## Theme Extensibility Review

The theme system is extensible:

- Tokens are separated into colors, spacing, typography, radius, and elevation.
- Light/dark themes are explicit.
- React Native Paper and React Navigation themes are aligned from the same tokens.
- Future token categories such as motion, opacity, and icons can be added without changing feature code.

Risk to watch: feature code must keep using tokens and shared components once UI components are introduced.

## Storage Abstraction Review

MMKV is behind `KeyValueStorage`.

Strengths:

- No screen or feature directly imports MMKV.
- The abstraction exposes simple key-value operations.
- Replacement with encrypted storage is possible.

Future improvement:

- Add typed storage key namespaces.
- Add separate secure storage abstraction for secrets.
- Avoid expanding this abstraction until actual storage use cases exist.

## Database Abstraction Review

SQLite is initialized behind `src/platform/database`.

Strengths:

- Connection lifecycle is centralized.
- Database pragmas are configured once.
- No app tables or feature schema exist yet.

Future improvement:

- Add migration runner before first feature tables.
- Add repositories that hide database engine types from modules.
- Avoid exporting raw database handles to feature code.

Replacement with Realm remains possible if repositories depend on domain contracts rather than SQLite APIs.

## Notification Abstraction Review

Expo Notifications is isolated behind `src/platform/notifications`.

Strengths:

- Handler setup is centralized.
- Android channel setup is centralized.
- Current permission status is normalized into a local type.
- No business scheduling exists.

Future improvement:

- Add explicit permission request API.
- Add typed scheduling API.
- Add payload versioning before feature notifications.

Replacement with native notifications remains possible if modules never import Expo Notifications directly.

## Findings

No critical architectural issues require runtime changes.

Watch items for future milestones:

- Keep database engine types out of feature repositories.
- Introduce secure storage separately from MMKV before auth or secrets.
- Add migration tooling before application tables.
- Add logging sinks through `@core/logger`, not direct SDK imports.
- Keep provider additions centralized in `AppProviders`.
