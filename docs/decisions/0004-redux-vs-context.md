# 0004 Redux vs Context

## Decision

Use Redux Toolkit for shared client/app state instead of React Context as the primary state architecture.

## Rationale

Redux Toolkit provides predictable updates, DevTools support, middleware, and scalable conventions for apps with multiple modules.

## Consequences

- React Context remains acceptable for narrow provider concerns.
- Cross-module client state belongs in Redux.
- Server state belongs in TanStack Query.
