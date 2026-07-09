# Bootstrap Lifecycle

## Purpose

Milestone 3 establishes the application foundation without introducing product features or business logic.

## Root Flow

```txt
app/_layout.tsx
  -> AppRoot
    -> GestureHandlerRootView
      -> AppProviders
        -> ApplicationBootstrap
          -> AppShell
            -> Expo Router Stack
            -> StatusBar
```

## Provider Hierarchy

```txt
ReduxProvider
  QueryClientProvider
    PaperProvider
      Navigation ThemeProvider
        ApplicationBootstrap
          AppShell
```

## Provider Responsibilities

- `ReduxProvider`: exposes the Redux Toolkit store for future client/app state.
- `QueryClientProvider`: exposes the TanStack Query client for future server/cache state.
- `PaperProvider`: exposes the app light/dark Paper theme and design tokens.
- `Navigation ThemeProvider`: aligns Expo Router navigation colors with the app theme.
- `ApplicationBootstrap`: initializes platform services before rendering the shell.
- `AppShell`: owns root navigation stack and status bar configuration.

## Initialization Order

`ApplicationBootstrap` performs the current platform initialization:

1. Prevent the splash screen from hiding automatically.
2. Initialize MMKV through `src/platform/storage`.
3. Initialize SQLite through `src/platform/database`.
4. Initialize notification registration through `src/platform/notifications`.
5. Log bootstrap completion or failure.
6. Hide the splash screen.
7. Render the application shell.

## Current Platform Initialization

- MMKV is initialized with a framework-level storage id.
- SQLite opens the framework database and configures database pragmas only.
- Notifications register the root handler, Android default channel, and current permission status.
- No application tables are created.
- No notification business scheduling is implemented.
- No feature modules are implemented.

## Error Boundary

Expo Router receives a root error boundary from `src/core/errors`. It logs captured root route errors and offers a retry action.

## Boundaries

The bootstrap layer may initialize platform services. It must not contain feature behavior, domain workflows, business scheduling, or product-specific UI.
