# Import Conventions

## Path Aliases

Use aliases for cross-layer imports:

```ts
import { appConfig } from '@core/config';
import type { UnknownRecord } from '@shared/types';
```

Available aliases:

- `@/*`
- `@core/*`
- `@platform/*`
- `@shared/*`
- `@modules/*`
- `@state/*`
- `@query/*`
- `@/assets/*`

## Rules

- Prefer relative imports inside the same folder or feature module.
- Prefer aliases when crossing top-level architecture folders.
- Do not import from platform internals directly inside components or screens.
- Do not create circular imports between modules.
- Export public module APIs intentionally through index files only when it improves clarity.
