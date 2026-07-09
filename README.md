# RN Enterprise Starter

Enterprise-grade React Native Expo starter for reusable, offline-first production apps.

## Milestone 1

- Expo SDK 57 bootstrap
- Expo Router entry
- Strict TypeScript
- Root `app/` routes
- Approved architecture folders under `src/`

## Requirements

- Node.js 22.13.x or newer for Expo SDK 57

## Development

See [docs/README.md](./docs/README.md) for setup, architecture, project structure, design direction, and ADRs.

Milestone 3 provider hierarchy and bootstrap lifecycle are documented in [docs/BOOTSTRAP_LIFECYCLE.md](./docs/BOOTSTRAP_LIFECYCLE.md).

Platform audit results are documented in [docs/PLATFORM_AUDIT.md](./docs/PLATFORM_AUDIT.md).

Core verification commands:

```sh
npm run typecheck
npm run lint
npm test
```

## Governance

- [Security Policy](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [License](./LICENSE)

## Architecture Direction

```txt
app/
src/
  core/
  platform/
  shared/
  modules/
  state/
  query/
assets/
```

Feature modules stay simple:

```txt
modules/example/
  components/
  hooks/
  screens/
  services/
  repository/
  types/
  utils/
```

Dependency boundaries:

- Feature -> Repository -> Platform Service -> SQLite
- Components never call Axios directly.
- Screens never access MMKV directly.
- Features never access SQLite, MMKV, or Axios directly.
