# Performance Guidelines

## Principles

- Optimize for correctness and clarity first.
- Design APIs that allow performance improvements later.
- Measure before making complex optimizations.

## Mobile Concerns

- Avoid unnecessary re-renders in reusable components.
- Keep lists virtualized when rendering large datasets.
- Avoid blocking the JS thread with heavy synchronous work.
- Use SQLite for relational offline data rather than loading large datasets into memory.
- Keep persisted key-value data small.
- Avoid large bundle additions without a clear reason.

## Review Triggers

Performance review is required for:

- New dependencies
- Large lists
- Database queries
- Animation-heavy UI
- Background sync
- Notification scheduling at scale
