# Widget verification — October 7, 2026

Device: Pixel 8 emulator, `emulator-5556`, Android 17, 1080 × 2400, density 500.

## Verified on device

- A widget drink updated its total without opening the app.
- With the app process stopped, two 500 ml taps changed the widget from 500 ml to 1,500 ml. Reopening Home showed exactly 1,500 ml.
- Health Connect's hydration screen contained exactly four drinks: 250, 250, 500 and 500 ml. The native background exporter completed successfully before opening the app.
- Changing selected glasses immediately changed the widget buttons, including an existing custom 237 ml glass. The original 250 ml default was restored afterwards.
- Large and compact launcher sizes displayed the selected glass artwork, readable totals and an unclipped add button.

ARTEMIS screenshot/hierarchy observations and ADB actions established these paths. Autonomous ARTEMIS Pro and Flash attempts were stopped after the model provider returned repeated HTTP 503 responses.

## Repeatable checks

The smoke test requires an onboarded app using ml, and its widget on the current launcher page. It adds test drinks and preserves existing history:

```sh
python scripts/verify-widget.py --serial emulator-5556 --amount-ml 250 --cold
```

The script locates text/accessibility elements, waits for each expected total, and checks the exact app total after widget additions. Its coordinate fallback is restricted to the explored Pixel 8 layout.

- Jest: 39 suites, 210 tests passed.
- TypeScript: passed.
- ESLint for changed TypeScript: passed.
- Android APK build and native compilation: passed.
- Local upload signing configuration was restored from its existing backup after Expo regenerated the ignored Android directory; `:app:validateSigningRelease` passed. The emulator validation APK uses the debug signing configuration.

Service regression coverage includes drinks queued during another health sync, stable widget record identities, duplicate import prevention, Health Connect pagination, and native unavailability errors.
