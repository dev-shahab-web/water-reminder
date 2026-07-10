# Expo Development Build

## Purpose

Water Reminder uses an Expo Development Build for native Android development. This replaces the Expo Go workflow and allows the app to run with its own native package, generated Android project, native modules, app metadata, icons, splash assets, and debug installation.

This is infrastructure only. Product UX, routing, providers, theme, and business logic remain owned by the existing SMP architecture.

## Initial Setup

Install project dependencies:

```sh
npm install
```

Install or refresh native Android files from Expo app config:

```sh
npm run prebuild
```

Build and install the debug app:

```sh
npm run android
```

Start Metro for an already-installed development build:

```sh
npm start
```

## Android Studio

Install Android Studio and include:

- Android SDK.
- Android SDK Platform Tools.
- Android Emulator.
- A current Android SDK platform.

Set `ANDROID_HOME` if Android Studio is not installed at the default location:

```sh
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

Open the generated native project from:

```txt
android/
```

Android Studio should use the generated Gradle project. Native changes should generally be avoided unless they are intentional infrastructure work; prefer app config and config plugins so prebuild can regenerate native files safely.

## Emulator

Create an Android Virtual Device in Android Studio:

- Use a recent Pixel profile.
- Use a Google APIs or Google Play system image.
- Start the emulator before running `npm run android`.

Verify the device is visible:

```sh
adb devices
```

## Metro Workflow

For normal JavaScript and TypeScript development:

```sh
npm start
```

The development build should open the Metro URL directly. Expo Go is no longer required.

If Metro is already running, pressing reload in the debug app should fetch the latest JavaScript bundle.

## Fast Refresh

Fast Refresh works through Metro:

1. Keep `npm start` running.
2. Edit JavaScript or TypeScript files.
3. The development build updates without reinstalling the native app.

Fast Refresh does not apply to native project changes, config plugin changes, dependency autolinking changes, app icon changes, splash config changes, Android manifest changes, or Gradle changes.

## Native Rebuild Workflow

Rebuild the native app when changing:

- `app.json` native config.
- Expo config plugins.
- Native dependencies.
- Android permissions.
- App icon or splash assets.
- Native Android files.

Use:

```sh
npm run prebuild
npm run android
```

For a clean native regeneration:

```sh
npm run clean
npm run android
```

## Available Scripts

```sh
npm start
```

Starts Metro for the Water Reminder development build.

```sh
npm run android
```

Builds, installs, and launches the Android debug development build.

```sh
npm run prebuild
```

Generates or updates the Android native project from Expo app config.

```sh
npm run clean
```

Regenerates the Android native project from a clean state.

## Troubleshooting

### Expo Go opens instead of Water Reminder Debug

Install the development build:

```sh
npm run android
```

Then start Metro:

```sh
npm start
```

### Android SDK path not found

Set `ANDROID_HOME`:

```sh
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

Restart the terminal and run:

```sh
adb devices
```

### Emulator is not detected

- Start the emulator from Android Studio.
- Run `adb devices`.
- Restart ADB if needed:

```sh
adb kill-server
adb start-server
adb devices
```

### Native changes are not reflected

Rebuild the development build:

```sh
npm run prebuild
npm run android
```

Use the clean workflow if generated files look stale:

```sh
npm run clean
npm run android
```

### Metro connects to the wrong app

Stop Metro and restart it for the development build:

```sh
npm start
```

Confirm the installed Android app is Water Reminder Debug, not Expo Go.

### React Native DevTools shared library error

If the host reports a missing library such as `libnspr4.so`, Metro can still run, but React Native DevTools may not start. Install the missing system library through the operating system package manager.

## Verification Checklist

Run:

```sh
npm install
npx expo prebuild
npx expo run:android
npm run lint
npm run typecheck
npm test
```

The expected result is that Android installs and launches the Water Reminder debug development build directly, without requiring Expo Go.
