# Folder Rules

## Top-Level Folders

- `app`: Expo Router route files only.
- `src/core`: framework-level config, env, logging, errors, and dependency wiring.
- `src/platform`: platform service adapters.
- `src/shared`: reusable UI, hooks, tokens, utilities, constants, and shared types.
- `src/modules`: feature modules.
- `src/state`: Redux Toolkit store and slices.
- `src/query`: TanStack Query client and key factories.

## Feature Modules

Feature modules should use this shape:

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

## Boundaries

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
