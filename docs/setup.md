# Setup

## Requirements

- Node.js 22.13.x or newer
- npm
- Expo-compatible Android/iOS development environment when running native targets

## Install

```sh
npm install
```

macOS/Linux:

```sh
sh scripts/setup.sh
```

Windows PowerShell:

```powershell
./scripts/setup.ps1
```

## Environment

Copy `.env.example` to `.env` locally and set values as needed.

```sh
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=
```

Only `EXPO_PUBLIC_` variables are available to the client bundle.

## Diagnostics

```sh
sh scripts/doctor.sh
```
