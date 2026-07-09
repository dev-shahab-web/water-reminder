# Database Guidelines

## Purpose

SQLite is the local relational persistence layer for offline-first domain data.

## Rules

- Feature code does not access SQLite directly.
- Database access flows through platform database services and repositories.
- Migrations are required for schema changes.
- Schema changes must be backward-aware.
- Repositories expose domain-oriented methods, not SQL details.
- Database errors must be normalized before reaching UI.

## Ownership

Platform database services own:

- Connection lifecycle
- Migrations
- Transactions
- Low-level SQL execution

Repositories own:

- Domain persistence APIs
- Mapping database rows to domain types
- Query composition for a specific module

## Data Integrity

Use transactions for multi-step writes. Prefer explicit constraints and indexes when they protect correctness or meaningful performance.
