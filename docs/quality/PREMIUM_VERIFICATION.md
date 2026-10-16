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
