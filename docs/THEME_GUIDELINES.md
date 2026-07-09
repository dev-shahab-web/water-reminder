# Theme Guidelines

## Purpose

The theme defines a consistent design language across all future apps.

## Token Categories

- Colors
- Spacing
- Radius
- Typography
- Elevation
- Motion
- Opacity
- Icons

## Rules

- No hardcoded colors in screens or components.
- No arbitrary spacing values in feature code once tokens exist.
- Theme values should express design intent, not implementation trivia.
- Semantic tokens are preferred over raw palette values.
- Dark mode and accessibility contrast must be considered when tokens are introduced.

## React Native Paper

React Native Paper should be wrapped by app-level theme conventions. Feature code should not become tightly coupled to Paper internals where a shared app component can provide a stable API.
