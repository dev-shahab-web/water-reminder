# Architecture

The starter uses a pragmatic feature-module architecture:

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
```

## Layers

- `core`: framework-level configuration, environment handling, errors, logging, and dependency wiring.
- `platform`: platform service adapters such as database, storage, notifications, permissions, network, and analytics.
- `shared`: reusable UI, hooks, tokens, constants, utilities, and shared types.
- `modules`: app features such as water, history, settings, expenses, and habits.
- `state`: Redux Toolkit store and slices.
- `query`: TanStack Query client configuration and query key factories.

## Dependency Boundaries

Allowed:

```txt
Feature -> Repository -> Platform Service -> SQLite
```

Forbidden:

- Feature -> SQLite
- Feature -> MMKV
- Feature -> Axios
- Component -> Axios
- Screen -> MMKV
- Screen -> SQLite

Route files in `app/` should stay thin and delegate to module screens when modules are introduced.
