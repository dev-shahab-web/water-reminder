# Brand Asset Integration

## Final Asset Structure

```txt
assets/branding/
  source/
    master-logo.svg
  app/
    icon.png
    adaptive-icon-foreground.png
    adaptive-icon-background.png
    monochrome-icon.png
    splash-icon.png
    notification-icon.png
    widget-icon.png
    favicon.png
  store/
    play-store-icon.png
    feature-graphic.png
  github/
    github-banner.png
```

## Runtime App Assets

| Asset                                              | Purpose                                        | Bundled in app? | Requirements                                                |
| -------------------------------------------------- | ---------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `assets/branding/app/icon.png`                     | Standard Expo/app icon                         | Yes             | PNG, 1024 x 1024, transparent                               |
| `assets/branding/app/adaptive-icon-foreground.png` | Android adaptive icon foreground               | Yes             | PNG, 432 x 432, transparent, safe-zone aware                |
| `assets/branding/app/adaptive-icon-background.png` | Android adaptive icon background               | Yes             | PNG, 432 x 432                                              |
| `assets/branding/app/monochrome-icon.png`          | Android 13+ themed icon                        | Yes             | PNG, 432 x 432, transparent, single-color silhouette intent |
| `assets/branding/app/splash-icon.png`              | Expo splash mark                               | Yes             | PNG, 2048 x 2048, transparent                               |
| `assets/branding/app/notification-icon.png`        | Android notification small icon                | Yes             | PNG, 96 x 96, transparent monochrome silhouette             |
| `assets/branding/app/widget-icon.png`              | In-app BrandMark source and widget source copy | Yes             | PNG, 512 x 512, transparent                                 |
| `assets/branding/app/favicon.png`                  | Web favicon                                    | Web only        | PNG, 64 x 64                                                |

## Store And Repository Assets

| Asset                                       | Purpose                     | Bundled in app?          | Requirements            |
| ------------------------------------------- | --------------------------- | ------------------------ | ----------------------- |
| `assets/branding/store/play-store-icon.png` | Google Play icon upload     | No runtime reference     | PNG, exactly 512 x 512  |
| `assets/branding/store/feature-graphic.png` | Google Play feature graphic | No runtime reference     | PNG, exactly 1024 x 500 |
| `assets/branding/github/github-banner.png`  | README banner               | No app runtime reference | PNG, 1280 x 640         |
| `assets/branding/source/master-logo.svg`    | Editable brand source       | No app runtime reference | SVG                     |

## Expo Configuration

`app.json` references only app-bundled assets:

- `expo.icon`
- `expo.ios.icon`
- `expo.android.adaptiveIcon.foregroundImage`
- `expo.android.adaptiveIcon.backgroundImage`
- `expo.android.adaptiveIcon.monochromeImage`
- `expo.notification.icon`
- `expo.web.favicon`
- `expo-splash-screen` image

Package name, version, Firebase configuration, Health Connect permissions, widget plugin, and existing plugins must remain unchanged when replacing brand assets.

## Splash Configuration

Selected splash background:

```txt
#F7FBF8
```

Rules:

- Minimal centered mark.
- No full-screen marketing artwork.
- No artificial delay.
- No Expo/default artwork.
- Avoid white/black flash by keeping the background aligned with the light app surface.

## Notification Icon Rules

The notification icon must be a white/monochrome silhouette with transparent background intent. Android renders small notification icons as masks, so never use the launcher icon as the notification small icon.

Current config:

- Icon: `assets/branding/app/notification-icon.png`
- Accent color: `#007A8A`

Manual native verification is required after prebuild/release build.

## Widget Icon Source

The widget template resource is:

```txt
plugins/water-reminder-widget/android/res/drawable/water_reminder_widget_mark.png
```

It is copied from:

```txt
assets/branding/app/widget-icon.png
```

The widget config plugin copies binary assets and text templates into generated Android output during prebuild. Do not edit generated files under `android/` as the source of truth.

## Adaptive Icon Safe Zone

The foreground artwork must fit within the Android adaptive-icon safe zone. Keep the primary mark centered with generous padding so launcher masks do not crop the drop or ripple.

Actual themed-icon appearance depends on Android version, launcher, and user settings.

## Validation

Run:

```sh
npm run validate:assets
```

The validation script checks required files, extensions, dimensions, and size limits without requiring native builds.

## Future Replacement Process

1. Replace files in `assets/branding/` using the same filenames.
2. Preserve PNG transparency where required; validation requires alpha for launcher, adaptive foreground, monochrome, splash, notification, and widget marks.
3. Do not convert PNG assets to JPG.
4. Copy updated widget icon to `plugins/water-reminder-widget/android/res/drawable/water_reminder_widget_mark.png`.
5. Run `npm run validate:assets`.
6. Run `npm run lint`, `npm run typecheck`, and `npm test`.
7. Human release owner runs prebuild/native build/manual visual checks.
