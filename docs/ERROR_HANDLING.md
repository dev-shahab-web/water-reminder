# Error Handling

## Purpose

Errors should be predictable, typed, observable, and user-safe.

## Rules

- Do not expose raw platform, database, or network errors directly to UI.
- Normalize errors at layer boundaries.
- UI receives display-safe messages or error states.
- Logs may include technical details, but user-facing text should not.
- Expected failures should be represented explicitly.

## Error Categories

- Validation error
- Network error
- Authentication error
- Authorization error
- Not found error
- Conflict error
- Storage error
- Database error
- Unknown error

## Responsibility

Platform services normalize low-level failures. Repositories add domain context. Hooks adapt errors for screens. Components render error states.
