# 0001 Overall Architecture

## Status

Accepted

## Context

The repository is a reusable React Native framework for multiple production apps, not a single-purpose application.

## Decision

Use a pragmatic architecture organized around `core`, `platform`, `shared`, `modules`, `state`, and `query`.

Feature modules stay simple with `components`, `hooks`, `screens`, `services`, `repository`, `types`, and `utils` instead of a heavier domain/application/data/presentation hierarchy.

## Consequences

- Framework concerns remain separate from app features.
- Features remain easy to read and onboard.
- Platform details are isolated behind service adapters.
- Dependency boundaries must be documented and enforced during implementation.
