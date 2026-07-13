# Release Checklist

## Android Widgets

- Run `npx expo prebuild --platform android --clean`.
- Confirm the widget config plugin regenerates Android files without manual edits.
- Confirm the widget header uses the Water Reminder vector mark in compact, medium, and expanded sizes.
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

## Brand And Store Readiness

- Confirm `assets/brand/water-reminder-mark.svg` matches configured raster icon assets.
- Confirm Android adaptive icon foreground, background, monochrome, splash, and favicon assets are present.
- Confirm widget vector branding matches the app mark at small sizes.
- Confirm Play Store copy avoids medical claims, guilt language, account requirements, cloud-sync claims, and advertising language.
- Confirm screenshots include Home progress, quick add, reminders, history/statistics, settings/privacy, Health Connect optionality, and the Android widget.
- Confirm About rows open privacy, terms, open-source, feedback, and rating surfaces without requiring an account.
- Confirm Reduce Motion disables continuous Home water motion while preserving clear progress updates.
