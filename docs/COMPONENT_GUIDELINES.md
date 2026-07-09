# Component Guidelines

## Purpose

Components provide reusable presentation primitives. They should be boring, predictable, accessible, and theme-driven.

## Rules

- Components do not contain business logic.
- Components do not call Axios, SQLite, MMKV, or platform SDKs.
- Components receive data and callbacks through props.
- Components use design tokens instead of magic numbers.
- Components expose variants intentionally.
- Shared components live in `src/shared/components`.
- Feature-specific components live inside their module.

## Planned Shared Components

- `AppButton`
- `AppCard`
- `AppInput`
- `AppDialog`
- `AppAvatar`
- `AppToolbar`
- `AppScreen`
- `AppList`
- `AppBadge`
- `AppChip`

## Playground

Reusable components should be visible in the playground before they are used broadly. The playground is the lightweight Storybook alternative for this starter.
