# 0005 Use SQLite

## Decision

Use SQLite for relational offline-first domain data.

## Rationale

SQLite is stable, local-first, relational, and suitable for reminders, habits, expenses, notes, and history-style data.

## Consequences

- Database access is isolated behind platform services and repositories.
- Schema migrations are required.
- Feature code never accesses SQLite directly.
