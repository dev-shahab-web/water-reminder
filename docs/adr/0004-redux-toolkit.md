# 0004 Redux Toolkit

## Status

Accepted

## Context

The starter needs predictable client state management for app state that is not owned by server cache or persistent storage.

## Decision

Use Redux Toolkit for client/app state.

## Consequences

- Redux stores UI state, preferences, session metadata, and cross-module client state.
- Server state belongs to TanStack Query.
- Persistent domain data belongs behind repositories and platform storage/database services.
