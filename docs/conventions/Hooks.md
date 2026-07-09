# Hook Conventions

Hooks coordinate UI-facing behavior. They should not become hidden service layers.

## Rules

- Hooks may call repositories, services, Redux selectors/dispatchers, and TanStack Query hooks.
- Hooks should return stable, UI-friendly data.
- Hooks should not contain raw SQL, raw Axios calls, or MMKV access.
- Hooks should not duplicate business rules already owned by repositories or services.
- Shared hooks live in `src/shared/hooks`.
- Feature hooks live in `src/modules/<feature>/hooks`.
