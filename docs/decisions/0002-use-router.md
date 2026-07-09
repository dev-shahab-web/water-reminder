# 0002 Use Expo Router

## Decision

Use Expo Router for navigation.

## Rationale

Expo Router provides file-based routing, deep-link support, typed routes, and a model familiar to React/Next.js developers.

## Consequences

- Routes live in root `app/`.
- Route files stay thin.
- Feature screens live under `src/modules`.
