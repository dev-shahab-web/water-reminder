# Wear OS Play Store screenshots

Captured on October 20–21, 2026, from the connected Samsung Galaxy Watch4 Classic (SM-R895F) running the release app, package `com.shahab.waterreminder`, version 1.0.0 (1000010).

## Upload

In Play Console, open the existing Water Reminder app, choose its store listing, and find the Wear OS screenshot section under Graphics. Upload only the seven PNG files from `upload/`, in their numbered order. Add them to the Wear OS form factor, rather than the phone screenshot section.

| Order | Screen                         | Feature shown                                                                 |
| ----- | ------------------------------ | ----------------------------------------------------------------------------- |
| 1     | Daily progress and quick add   | Water fill, daily goal, remaining amount, one tap logging                     |
| 2     | Amount picker                  | Preset drink amounts from the paired phone                                    |
| 3     | Recent watch drinks            | Phone sync status and Undo                                                    |
| 4     | Saved on watch                 | Local logging awaiting phone synchronization                                  |
| 5     | Daily hydration tile in ounces | Glanceable progress, ounces synchronized from the phone, and entry to logging |
| 6     | Watch face complication        | Live daily hydration percentage and droplet icon                              |
| 7     | Jade theme                     | Premium colors and typography synchronized from the phone                     |

The PNGs are native 450 × 450, square, opaque RGB screenshots. Their UI pixels are preserved. No captions, device frames, transparent circular masks, or added graphics are included. The black outer corners are part of the watch screen capture.

`preview-sheet.jpg` is a labeled contact sheet for review only. Do not upload it as a screenshot. `manifest.json` records dimensions and SHA256 checksums. Original device screenshots and UI hierarchy files are retained in the working `raw/` directory.

## Accurate listing claims

The Wear app needs the paired Android Water Reminder app and an active Water Reminder Plus plan. A Google Play license tester's new test purchase enabled these captures. No payment or account screens are included.

The companion supports daily progress, preset logging, recent watch drinks with Undo, queued offline logging, phone synchronization, themes, units, a tile, and a complication. Full history, reminders, Health Connect, home screen widgets, and premium launcher icons are phone features; these watch screenshots do not claim those features.

## Reference

Wear screenshot requirements: https://developer.android.com/docs/quality-guidelines/wear-app-quality

This screenshot pack is separate from publishing the app bundle or completing the remaining Play delivery and release checks described in `docs/quality/WEAR_OS_VERIFICATION.md`.

## Restored state

The two capture-session drinks were removed using the phone history UI after the watch locked. October 20 is restored to 500 mL and October 21 to 0 mL. Ocean, millilitres, phone Wi-Fi/mobile data/Bluetooth, watch font scale 1.0, charging stay-awake 2, and the one-minute watch screen timeout are restored. No security settings were changed.
