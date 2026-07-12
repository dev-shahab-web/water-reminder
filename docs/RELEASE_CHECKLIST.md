# Release Checklist

## Android Widgets

- Run `npx expo prebuild --platform android --clean`.
- Confirm the widget config plugin regenerates Android files without manual edits.
- Run `./gradlew :app:assembleDebug`.
- Run `./gradlew :app:assembleRelease`.
- Add compact, medium, and expanded widgets on an Android launcher.
- Verify widget quick-add works while the app is closed.
- Verify widget entries appear in Home, History, Statistics, and export data.
- Verify reset/delete history clears widget progress on the next refresh.
- Verify widgets remain optional and the app works normally without adding one.

## Core Quality

- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm test`.
- Run `npx expo-doctor`.
- Verify dark mode, large text, reduced motion, and screen reader basics on Android.
