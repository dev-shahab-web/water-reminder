# Development

## Scripts

- `npm start`: start Expo.
- `npm run android`: start Expo for Android.
- `npm run ios`: start Expo for iOS.
- `npm run web`: start Expo for web.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run lint`: run Expo ESLint.
- `npm run format`: format the repository with Prettier.
- `npm run format:check`: check formatting.
- `npm test`: run Jest.
- `npm run commit`: create a conventional commit with Commitizen.

## Utility Scripts

- `scripts/setup.sh`: install dependencies and run the core verification gate on macOS/Linux.
- `scripts/setup.ps1`: install dependencies and run the core verification gate on Windows PowerShell.
- `scripts/doctor.sh`: print runtime versions and run typecheck, lint, tests, and formatting check.
- `scripts/clean.sh`: remove generated local artifacts.
- `scripts/reset.sh`: remove generated local artifacts and reinstall dependencies.

## Commits

Commits are validated with Commitlint and should follow Conventional Commits:

```txt
feat: add reusable app button
fix: normalize API errors
docs: document dependency boundaries
```

## Dependency Policy

Every dependency must satisfy:

- Actively maintained
- TypeScript support
- Expo compatible
- Tree-shakeable where applicable
- Well documented
- Large community
- Used in production
- Low bundle impact
