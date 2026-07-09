# Engineering Principles

## Priorities

1. Readability
2. Maintainability
3. Scalability
4. Developer experience
5. Performance
6. Type safety

## Rules

- Prefer simple abstractions that encode real boundaries.
- Keep business logic out of UI components.
- Prefer composition over inheritance.
- Avoid global mutable state unless it is explicitly owned by Redux, Query, or a platform service.
- Do not introduce dependencies without documenting why they are needed.
- Avoid premature optimization, but design APIs that do not block future optimization.
- Every major architectural decision belongs in docs.

## TypeScript

- Strict TypeScript is required.
- Avoid `any`.
- Prefer explicit domain types over loosely shaped objects.
- Validate external data at boundaries.

## Maintainability

Code should be understandable by a future maintainer without needing hidden project history. Names, boundaries, and docs must carry intent.
