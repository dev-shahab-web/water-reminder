# Testing Conventions

## Test Targets

Prioritize tests for:

- Utilities
- Hooks
- Services
- Repositories
- Error normalization
- Data mapping

Avoid tests that only assert implementation details or duplicate TypeScript checks.

## Naming

Test files should use:

```txt
*.test.ts
*.test.tsx
```

## Scope

- Unit tests should stay close to the code under test.
- Shared behavior should have shared tests.
- Module behavior should be tested inside the module.
- UI tests should verify user-visible behavior, not internal component state.
