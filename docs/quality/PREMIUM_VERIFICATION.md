# Premium verification — October 16, 2026

## Environment

- Pixel 7, serial `35201FDH2006ET`, Android 17, 1080 × 2400.
- A separate `com.shahab.waterreminder.premiumpreview` debug installation was used.
  Existing production and sync-validation installations were preserved.
- Native sources generated through Expo config plugins; Android debug APK built
  successfully with Billing Library 8.0.0 and the widget/native icon code.
- No Play products or licensing public key were configured, so device checks used
  the explicitly labeled USD preview state. No purchase was made or simulated.

## Completed

- ARTEMIS explored the existing app and observed the new paywall and premium
  settings on the connected phone. Its autonomous runs encountered upstream
  timeouts/quota errors. After diagnosis, the remaining interactions were completed
  using ADB and live UI hierarchy locators.
- Monthly selection: `premium-plan-monthly` became checked; the bottom button
  changed to `Continue with monthly plan` and the monthly renewal disclosure.
- One-time selection: `premium-plan-lifetime` became checked; the bottom action
  changed to lifetime and the disclosure stated no recurring payments.
- Yearly selection: `premium-plan-yearly` became checked; the button changed back
  to yearly with the full annual charge. Preview annual savings displayed 45%.
- `premium-continue` remained disabled for the unconfigured preview; restore was
  disabled too. Missing billing configuration never grants local premium access.
- Terms opened the purchase-terms dialog. Its OK control dismissed it.
- `premium-theme-jade` was unchecked and labeled `Jade theme, requires Plus`.
  Tapping it opened the paywall; Ocean remained the free theme.
- Wear OS was visibly marked `Coming soon`.
- The live check found that the telemetry screen allowlist initially rejected the
  two new routes. Both routes were added with regression assertions, and the
  device navigation was repeated successfully.

## Automated checks

- `npm test -- --runInBand`: **45 suites, 246 tests passed**.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.

The premium tests cover localized prices, missing products, annual savings,
full billing disclosure, plan selection, disabled preview/pending checkout,
cancellation, restoration, expired access and cached access during outages.
Existing motion-test mock types were corrected for the current React Native/Jest
types so the repository-wide type check passes.

## Still requires Play testing

Real checkout, acknowledgement, refunds, renewal/expiry, account-country prices,
pending approval and restore after reinstall require activated Play products, the
licensing public key and a testing-track installation. Paid native widget actions
and launcher icon switching must be exercised with that verified purchase.
Large-font, light-theme and other-device visual checks have not been completed.
Wear OS is not implemented. See [Premium setup](../PREMIUM.md).

## Trial and promotion follow-up — October 17, 2026

- Android debug build passed after adding native eligible-offer selection and
  the checkout offer-change guard. The Pixel 7 preview installation was updated
  without uninstalling any app or clearing hydration records.
- ARTEMIS live hierarchy/screenshot observations plus ADB verified the new
  **Daily Plus tips & offers** switch, initially off, and its 6 PM local-time copy.
  Opting in while billing is unconfigured saved the preference but scheduled no
  promotional notifications.
- A temporary development-only **free catalog fixture**, with sample USD prices
  and a 7-day trial, verified monthly/yearly trial selection, the recurring-price
  disclosure, and the `Start 7-day free trial` button. This was a UI fixture,
  not a simulated purchase or entitlement. No checkout was attempted.
- The paywall website link opened the actual Lumarc Studio app page in Chrome
  with the expected `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`.
- With the free catalog fixture and a temporary near-future delivery time,
  Android persisted exactly **one** Plus `DailyTrigger`. Hydration schedules
  remained alongside it. The Plus notification arrived in the background on its
  own channel with `AUTO_CANCEL|SILENT`, no sound and no vibration. Android
  delivered the inexact alarm about 90 seconds after its target time.
- Tapping the notification opened the paywall. UIAutomator could not reach an
  idle notification-shade state, so the tap used the verified live screenshot
  after bounded XML attempts. The final route was confirmed through ARTEMIS.
- The sample catalog and temporary delivery time were removed. Production code
  again requires Play catalog/ownership verification, uses 18:00 local time, and
  never advertises an unverified trial.
  The final billing-unavailable refresh removed the Plus schedule while retaining
  all 64 hydration schedules. The preview app's offers preference was returned to off.
- `npm test -- --runInBand`: **47 suites, 264 tests passed**. New tests cover
  trial/no-trial disclosure, changed offers, duplicate schedules, opt-out,
  paid/pending/unknown entitlement, permission denial, scheduling races, and
  cold-start/repeated-day notification response handling. Cold-start behavior
  was unit-tested; only a warm notification tap was verified on the phone.
- TypeScript, lint and Android debug compilation passed.

Real Play trial eligibility, post-trial charging, cancellation before conversion,
renewal, refunds and purchase restoration remain testing-track checks. The
website campaign copy is prepared in `docs/PREMIUM_GROWTH.md`, not deployed.

## Theme studio follow-up — October 18, 2026

- Added `paywallsetup.md` with exact product/base-plan/offer mapping, both
  seven-day trials, country prices, public licensing key, release and Play
  testing instructions, and the customer theme flow.
- The selected test device is the user's **Pixel 8 emulator (`emulator-5556`)**.
  The Pixel 7 was in use by an unrelated ARTEMIS task. Its task was left running.
  Checks use the isolated `com.shahab.waterreminder.premiumpreview` installation;
  the existing production package and hydration records are preserved.
- The x86_64 Android debug build passed. The Android production JS export passed
  and contained all nine offline font assets plus both icon fonts. The fonts'
  OFL licenses and pinned source revision are stored with the assets.
- ARTEMIS hierarchy/screenshots and ADB verified selecting Material Expressive,
  changing its preview to dark, the actual Google Sans Flex text and colored
  sample, and the Unlock action opening the paywall without applying a theme.
- A temporary development-only UI access fixture in the isolated preview app
  exercised the real Apply service. Material Expressive changed Home and
  Settings typography, colors, icon styles and tonal surfaces. Switching the
  normal Settings appearance control to Dark retained the Expressive style.
  Rose applied its Lora headings, warm palette and outline icons; its dark
  preview and light Home were visually checked. The emulator used 1080 × 2400,
  density 500 and font scale 1.0; large-font and tablet layouts remain unchecked.
- Expiring the fixture returned the rendered Home to Ocean. The observed state
  retained `theme: rose` with inactive access, confirming preference retention
  without an unlock. The fixture never granted native entitlement, and no Play
  checkout or paid launcher/widget action was attempted.
- Restored the preview app's saved defaults, restored the real feedback route,
  deleted the temporary fixture, and force-stopped/relaunched the app to discard
  in-memory access. The normal Ocean Home and real feedback screen were verified
  after restart. The final source search found no fixture entry points.
- Device exploration found a Paper icon callback being called outside a React
  component. The renderer now returns a component that owns the theme hook.
  The provider tests exercise the actual Paper Icon path to prevent regression.
- Tests cover full palette text contrast, system font fallback, deliberate Apply,
  free/expired access, saved preferences, timed fallback to Ocean, restored
  access, and returning from checkout to the selected preview.
- Initial development startup also logged an existing expo-notifications warning
  about the `default` channel sound, and Firebase deprecation warnings. These
  are separate from the theme renderer; no theme/font load errors remained.
- Final `npm test -- --runInBand`: **52 suites, 294 tests passed**.
  TypeScript, ESLint and `git diff --check` passed after fixture removal.

Real Play checkout, trial eligibility, renewals, restores and native paid icon/
widget operations still need the configured Play testing-track installation.
The paid visual fixture is not evidence of a purchase or native entitlement.
