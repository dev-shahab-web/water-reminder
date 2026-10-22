# Wear OS verification — October 20, 2026

Production package `com.shahab.waterreminder` was installed on the user-selected
Pixel 7 (`35201FDH2006ET`, Android 17) and Galaxy Watch4 Classic SM-R895F
(`192.168.1.16:44443`, Android 16/Wear OS 6, 450×450, density 340).
Phone version: 2.0.4 (10). Watch version: 1.0.0 (1000010).
The duplicate mDNS watch transport and the emulator were not paired-test targets.

## Physical paired release checks

The user activated Plus with a Google Play test account. Testing used that native
entitlement, without modifying billing state or using the debug fixture. Live
Play prices loaded in INR. This verifies active Plus propagation; it does not
independently verify purchase restoration, renewal, refunds, or expiry.

- Both production APKs have matching certificates and package IDs. Phone release
  APK/AAB source, signature and shared SQLite guards passed. The existing Play
  phone installation required replacement because its certificate differed from
  the local release; uninstall was explicitly authorized. Old sync-validation
  apps were removed from both devices; their duplicate tile entry was eliminated.
- Phone connection screen identified the Galaxy Watch4 Classic. Starting total
  was 500 mL with a 2,000 mL goal and 250/500/750 mL presets.
- Watch quick-add 250 mL reached 750 mL, received phone acknowledgment and appeared
  on the phone. Undo returned both to 500 mL. Logging and undo worked while the
  phone UI was on Home, and its foreground dashboard refreshed afterward.
- With phone Wi-Fi, mobile data and Bluetooth disabled, two watch drinks
  (250 mL and 500 mL through the amount picker) reached 1,250 mL. Both pending
  changes survived watch force-stop/relaunch. Offline undo of the latest 500 mL
  survived another restart. Restoring connectivity reconciled to 750 mL without
  double counting; undo of the remaining test drink restored 500 mL.
- Phone goal 2,000 → 3,000 mL and unit mL → oz propagated to the watch. Goal and
  unit were restored. Changing the first quick amount to 500 mL updated the watch
  action; the original 250/500/750 mL presets were restored.
- Applying Jade changed the physical watch palette and bundled rounded font.
  Ocean was restored after testing. Phone appearance preview alone was not
  counted as applying a theme.
- Daily hydration was added as a real tile. It rendered the live total and goal,
  updated to 1,000 mL / 50%, and opened the watch app through Log water without
  logging a drink automatically.
- The user selected Daily hydration for Radar's bottom complication through the
  Samsung chooser. Its live SHORT_TEXT data rendered 37% at 750/2,000 mL and 50%
  at 1,000/2,000 mL. Tapping it opened the app without changing the total.
- This check found missing provider/icon presentation and a rounding mismatch
  with the phone. Explicit service icons and a monochrome droplet were added,
  together with an accessibility description containing the percentage. The
  final release was rebuilt and installed, and its live droplet and **38%** at
  750/2,000 mL were verified. The final undo returned to 500 mL with acknowledgment.
- At watch font scale 1.5, the dashboard, quick-add, amount picker, sync status,
  recent drinks and Undo were readable and reachable by scrolling. Text wrapped
  in the buttons. The hero was fully visible after scrolling back to the top.
  Font scale was restored to 1.0.
- No Water Reminder crash was observed during these checks. A 19:54 crash in the
  watch crash buffer was the UI automation service registering twice, not an app
  crash. Screen dimming/keyguard and stale UI handles caused automation retries;
  fresh XML, explicit waits and manual unlocking were used for the successful
  checks. The watch pattern was never automated.

All scripted and surface-test drinks were undone. Final phone and watch totals
were 500 mL (25% of 2,000 mL), with Ocean applied and no pending test commands.
Phone radios, keyboard and charging stay-awake setting were restored; watch
font scale, one-minute timeout and charging stay-awake setting were restored.
The user-selected hydration complication and tile remain available.

## Executable and automated checks

`scripts/test-wear-paired.py` was authored after ARTEMIS screen observations and
ADB exploration. It uses fresh XML text/accessibility bounds, explicit bounded
waits and guarded 450×450 coordinate fallbacks. It ran successfully against the
production pair with `--offline`, passing all seven reported checkpoints.
It tests real Plus, phone-closed add/undo, two durable offline drinks, restart,
offline undo and reconnection. It restores radio settings in `finally` and undoes
its drinks on success. Do not manually log water while it runs.

```sh
python -m pip install uiautomator2
python scripts/test-wear-paired.py --phone 35201FDH2006ET --watch 192.168.1.16:44443 --offline --output paired-result.json
```

- Phone Jest: **54 suites, 316 tests passed in the full run**.
- Phone TypeScript and Expo lint passed.
- Three phone migrations passed against real SQLite, covering fresh/idempotent
  schema, reordered legacy columns with Health Connect IDs and rollback/deletion
  behavior. Seven release-guard tests passed in the earlier implementation run.
- Seven shared protocol unit tests passed, including strict payload/schema
  checks, receipt/config round-trip, timezone midnight, DST and offline bounds.
  `:wear:testReleaseUnitTest` passed again after the surface fixes.
- Nine watch SQLite instrumented tests previously passed on the round emulator:
  durable queue, atomic receipts, duplicate/stale acknowledgments, undo before
  receipt, cleanup race, foreign-phone rejection, reboot/rollback, expiry,
  invalid rejection and pruning. Production physical data was not replaced with
  an instrumented debug build.
- The final minified/resource-shrunk watch APK and AAB built successfully with
  Android release lint, correct package, debug-fixture exclusion and matching
  phone certificate. The production phone artifacts still passed their guards
  after the watch-only fixes. `git diff --check` passed.

Paired JSON results and selected screenshots are saved in
[`wear-paired-2026-10-20/`](wear-paired-2026-10-20/). The images include Jade,
150% font-size layouts, the updated tile and the final droplet complication.

## Remaining release checks

- Physical 24-hour offline entitlement expiry, midnight/day rollover and extended
  battery use remain unmeasured. Protocol/SQLite tests cover the underlying date,
  rollback and expiry rules; they do not replace long-duration hardware checks.
- TalkBack spoken navigation and rotary bezel behavior were not verified.
  Accessible hierarchy labels and large-text visual checks passed.
- The Radar SHORT_TEXT complication passed. RANGED_VALUE compiles and passes
  lint but was not selected on a compatible physical watch-face slot.
- Background Health Connect export/deletion for watch drinks was not verified;
  its READ/WRITE hydration permissions were not granted on this phone installation.
- A fresh-install free state and successful restoration of an active plan still need a Play test
  account exercise. The initial unpaired release and debug-only locked/expired
  UI were verified earlier on the round API 36 emulator (384×384).
- Play Wear form-factor delivery, app-signing-key equality, reserved watch version
  codes and store review remain release work. `features.wearOs.available` stays
  false until these release checks and Play delivery are ready.

ARTEMIS Pro hit remote 504 timeouts without executing device steps; direct
ARTEMIS observations and ADB supplied the verified exploration. After the phone
was unplugged/reconnected, the optional ARTEMIS helper tunnel was unavailable;
diagnosis remained ready and fresh UIAutomator2 observations worked.
No Play upload or public release was performed.

## Listing capture follow-up — October 20–21, 2026

The previous Play test subscription expired during capture, the physical watch showed the Plus-required screen, and Restore purchases reported no active plan. The user authorized a new purchase. Google Play showed the test-card/no-charge disclosure and Subscribe succeeded; phone and watch Plus features resumed. One midnight rollover was observed, with today’s total resetting to zero. This does not replace long-duration offline entitlement or battery checks.

Seven unaltered 450×450 RGB screenshots were captured from the installed release for daily progress, quick add, amount picker, synced Undo, offline saved drinks surviving restart, the live tile in ounces, the droplet/percentage complication, and Jade. [The listing pack](../store/wear-play-listing-2026-10-20/README.md) includes upload order, checksums, original captures, and capture evidence. All capture-session drinks were removed through phone history; October 20 returned to 500 mL and October 21 to zero. Ocean/ml and the phone radios were restored, together with the watch’s 60000 ms timeout, font scale 1.0 and charging stay-awake 2. Watch security settings were unchanged.
