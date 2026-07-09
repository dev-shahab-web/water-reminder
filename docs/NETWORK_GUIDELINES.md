# Network Guidelines

## Purpose

Networking must be centralized, typed, observable, and replaceable.

## Rules

- Components never call network clients.
- Screens never call Axios directly.
- Features interact with services or repositories.
- Raw network errors are normalized at the network boundary.
- Request and response data should be typed.
- External data should be validated when correctness matters.

## Responsibilities

The platform network layer owns:

- Base URL configuration
- Headers
- Auth injection when authentication exists
- Timeout policy
- Error normalization
- Request cancellation strategy
- Logging hooks

Feature services own:

- Endpoint-specific request functions
- Mapping transport data to module data
- Coordinating with repositories where offline behavior is required
