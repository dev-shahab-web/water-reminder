# 0003 Expo Router

## Status

Accepted

## Context

The starter needs scalable navigation, deep linking, and a familiar route model for developers with React and Next.js experience.

## Decision

Use Expo Router with root-level `app/` routes.

## Consequences

- Route files should remain thin.
- Feature screens should live in `src/modules/*/screens`.
- Typed routes remain enabled through Expo configuration.
