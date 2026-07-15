# Water Reminder Project Context

Water Reminder is Product #1 built on top of the Shahab Mobile Platform.

The platform foundation is complete. This repository now represents a production Android hydration reminder app, not a generic starter template.

## Current Product

Water Reminder is an offline-first hydration companion with:

- Onboarding.
- Home hydration dashboard.
- Water logging.
- SQLite canonical storage.
- MMKV/preferences.
- Local reminders.
- History and statistics.
- Settings and local data controls.
- Optional Health Connect hydration sync.
- Android home-screen widget.
- Optional Firebase Analytics and Crashlytics behind diagnostics consent.
- Final brand assets under `assets/branding/`.

## Working Principles

- Do not modify platform architecture unless a genuine product requirement reveals a limitation.
- Preserve offline-first core usage.
- Keep hydration records and Health Connect data out of telemetry.
- Keep business logic outside UI components.
- Use Expo Router as the navigation owner.
- Use source-controlled config plugins for native widget resources.
- Do not edit generated native Android output as source of truth.

## Release Context

Publication-readiness documentation lives under:

- `docs/release/`
- `docs/compliance/`
- `docs/legal/`
- `docs/store/`
- `docs/branding/`

Manual native builds, Play Console submission, Firebase Console verification, signing, emulator, ADB, and physical-device checks are performed by the release owner, not by Codex unless explicitly requested.
