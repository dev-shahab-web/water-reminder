# Feature Creation Guide

## Feature Folder

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

## Creation Steps

1. Define the feature responsibility.
2. Identify platform capabilities needed.
3. Define types.
4. Add repository contracts if persistence is required.
5. Add services for feature-specific coordination.
6. Add hooks for UI-facing behavior.
7. Add screens.
8. Add feature-specific components.
9. Add tests for utilities, services, hooks, and repositories.
10. Document any new architecture decision.

## Boundaries

- Screens coordinate presentation and call hooks.
- Hooks adapt services, repositories, Query, and Redux for UI.
- Services coordinate feature logic.
- Repositories own feature persistence APIs.
- Platform services own device and infrastructure APIs.

## Exit Criteria

A feature is complete only when typecheck, lint, tests, docs, and dependency boundaries are satisfied.
