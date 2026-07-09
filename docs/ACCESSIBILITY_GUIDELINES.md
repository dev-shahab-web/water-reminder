# Accessibility Guidelines

## Principles

- Accessibility is a product requirement, not a polish task.
- Reusable components should encode accessible defaults.
- UI must work with screen readers, dynamic text, and sufficient contrast.

## Rules

- Interactive elements need clear labels.
- Touch targets must be large enough for mobile use.
- Color must not be the only way to communicate state.
- Text should support scaling.
- Focus and modal behavior must be predictable.
- Error states should be announced clearly.

## Component Responsibility

Shared components should provide accessibility-friendly props and defaults so feature screens do not repeat low-level accessibility work.
