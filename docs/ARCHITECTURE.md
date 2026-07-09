# Architecture

## Purpose

This starter is a reusable React Native framework for multiple production applications. The architecture optimizes for maintainability, type safety, offline capability, and repeatable feature delivery.

## Top-Level Structure

```txt
app/
src/
  core/
  platform/
  shared/
  modules/
  state/
  query/
assets/
docs/
```

## Responsibilities

- `app`: Expo Router route files. Routes stay thin and delegate to module screens.
- `src/core`: framework-level configuration, environment handling, logging, errors, and dependency wiring.
- `src/platform`: adapters for device and infrastructure capabilities such as database, storage, network, permissions, notifications, and analytics.
- `src/shared`: reusable UI, hooks, theme tokens, constants, utilities, and shared types.
- `src/modules`: feature modules.
- `src/state`: Redux Toolkit store and slices.
- `src/query`: TanStack Query client and query key factories.

## Dependency Direction

Allowed:

```txt
Route -> Module Screen -> Module Hook -> Repository -> Platform Service
```

Forbidden:

- Components must not call network clients.
- Screens must not access SQLite or MMKV directly.
- Features must not import raw platform SDKs directly.
- Modules must not import from sibling module internals.

## Feature Shape

```txt
src/modules/example/
  components/
  hooks/
  screens/
  services/
  repository/
  types/
  utils/
```

The architecture is intentionally pragmatic. Avoid unnecessary ceremony, but keep boundaries firm.
