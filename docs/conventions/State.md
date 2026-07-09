# State Conventions

## Ownership

- Redux Toolkit owns client/app state.
- TanStack Query owns server/cache state.
- SQLite owns relational domain persistence.
- MMKV owns small non-secret key-value persistence.
- Secure values require a secure storage strategy.

## Redux

Use Redux for:

- UI state shared across screens
- Preferences
- Session metadata
- Cross-module client state

Do not use Redux for:

- Server response caching
- Large relational datasets
- Values that belong in platform storage

## Query

Use TanStack Query for:

- Remote data fetching
- Remote mutations
- Cache invalidation
- Future offline query persistence
