# State Management

## Ownership Model

- Redux Toolkit owns client/app state.
- TanStack Query owns remote server state and cache state.
- SQLite owns relational local domain data.
- MMKV owns small non-secret key-value state.
- Secure values require secure storage, not plain MMKV.

## Redux

Use Redux for:

- Cross-screen UI state
- Preferences
- Session metadata
- Client-only state shared across modules

Do not use Redux for:

- API response caching
- Large relational datasets
- Raw persistence wrappers

## TanStack Query

Use Query for:

- Remote reads
- Remote mutations
- Cache invalidation
- Future offline query persistence

## Boundary Rule

Only the owning layer should mutate its state. Other layers interact through typed APIs, hooks, repositories, or services.
