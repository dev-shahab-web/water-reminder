# Naming Conventions

## Files

- Components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- Utilities: `thing-utils.ts`
- Types: `thing.types.ts` or colocated `types.ts`
- Repository files: `thing.repository.ts`
- Services: `thing.service.ts`

## Symbols

- Components use `PascalCase`.
- Hooks start with `use`.
- Constants use `SCREAMING_SNAKE_CASE` only for true constants.
- Types and interfaces use `PascalCase`.
- Boolean values should read as predicates, such as `isEnabled`, `hasPermission`, or `canSync`.

## Modules

Module directory names use lowercase feature names:

```txt
src/modules/water/
src/modules/history/
src/modules/settings/
```
