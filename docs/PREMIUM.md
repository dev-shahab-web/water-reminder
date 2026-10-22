# Water Reminder Plus

The paywall is at `/paywall`, with entry points in Settings. `/premium-settings`
contains theme and Android launcher icon choices, widget instructions and
membership management. Core logging, reminders, history, Health Connect and
system/light/dark mode remain free.

## One place to configure plans

Edit `src/core/config/premium-config.ts`:

| Plan     | Google Play product            | Base plan | USD preview |
| -------- | ------------------------------ | --------- | ----------- |
| Monthly  | `water_reminder_plus`          | `monthly` | $1.99       |
| Yearly   | `water_reminder_plus`          | `yearly`  | $12.99      |
| One-time | `water_reminder_plus_lifetime` | —         | $29.99      |

These are editable sample prices, not approved launch prices. The config also
controls the preferred plan, benefit copy, feature availability, and the bounded
offline access period (24 hours by default; native limit 72 hours).

Google Play owns transaction prices. Set USD base prices and country/region
prices in Play Console. At runtime, BillingClient returns the customer's store
currency and formatted prices. These replace the config's preview prices on the
paywall. Device language is not used to guess the user's billing country.
Changing a preview amount in this file does not change the amount Play charges.
Changing a Play price does not require an app update; the catalog refreshes when
the app resumes and when the paywall opens.

Monthly and yearly support a configured **7-day free trial**. The native bridge
uses only the matching eligible Play offer: one free phase followed directly by
the full recurring price. If that offer is missing, ineligible or has different
terms, the regular base plan is used without a trial claim. Other introductory
pricing phases are not supported. Annual savings compare full recurring prices, never
across currencies or a mixture of store and preview prices. Missing products
cannot be purchased. A missing key or unavailable store leaves the screen in a
clearly labeled preview/unavailable state, with no local unlock button.

For complete click-by-click instructions, see [paywallsetup.md](../paywallsetup.md).

## Google Play setup

1. Create and activate the subscription and both auto-renewing base plans above.
   Use billing periods of one month and one year. Activate the one-time product
   as a non-consumable purchase. IDs can be changed in the config.
2. Configure target countries and USD/regional prices in Play Console. Make all
   three products grant the same Plus features.
   Under **each** monthly/yearly base plan, create and activate an offer with ID
   `trial-7-days`, a 7-day free phase, then the base-plan price. Select Play-managed
   **New customer acquisition → Never had any subscription in this app** eligibility.
   This prevents taking a second trial by switching plans. Do not use
   developer-determined eligibility; this app has no eligibility backend.
3. Copy the app's **Base64 RSA licensing public key** from Play Console's
   monetization/licensing settings into `.env` as
   `EXPO_PUBLIC_PLAY_BILLING_PUBLIC_KEY`. This is a public verification key;
   never put a service-account private key in the mobile app.
4. Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL` to the published
   policies, including subscription and refund terms.
5. Run `npx expo prebuild --platform android --no-install`, build and upload a
   signed release to a Play testing track, and install it through Google Play
   with a license tester account. Restart Metro/rebuild after changing env values.

Native source lives in `plugins/water-reminder-premium/`. The Expo config plugin
registers Billing Library 8.0.0, the React Native bridge, billing permission and
launcher aliases. Do not edit generated `android/` files as source of truth.
No RevenueCat account or SDK is used.

## Purchase and entitlement behavior

- Read both subscription and non-consumable ownership from Google Play.
- Only `PURCHASED` records with valid RSA signatures are eligible for access.
- Acknowledge eligible purchases before granting access; never consume the
  lifetime purchase. Pending and canceled purchases never unlock features.
- Restore uses the same validation path. Recheck ownership on app activation.
  A failed network/query request never replaces verified access with an empty
  ownership result. Previously verified access expires after its bounded offline
  window. Clock rollback before the verification time fails closed natively.
- Native widget rendering and the actual SQLite quick-add writer both check
  native billing access. A locked widget opens the paywall. No JavaScript
  preference or widget JSON flag can grant native access.
- Expired access falls back to the free theme. A successful ownership refresh
  with no purchases restores the original launcher icon. An icon may remain on
  the launcher while the app is stopped or offline; it is cosmetic.
- Existing members are directed to membership management rather than another
  checkout. Subscription switching/proration is not offered in this version.
- Before checkout, re-query the selected product. If the offer token, trial,
  currency or price changed, stop and refresh the paywall for the user to review.
  Do not silently replace a displayed free trial with an immediate charge.

This implementation uses on-device Play ownership queries and signature
verification. There is no purchase-verification backend, Real-time Developer
Notifications consumer or Play Developer API subscription-expiry lookup. Refunds
and revocations take effect at the next successful ownership check or offline
window expiration. A backend is needed for cross-device server entitlements,
immediate revocation and a future watch service; never send private Developer API
credentials to the mobile app.

## Premium features

- Android widgets: enabled by verified Plus access, including background actions.
- Themes: Ocean (free), Material Expressive, Jade, Dusk and Rose. Each paid theme
  coordinates full light/dark palettes, typography, surfaces, hydration visuals
  and in-app icons. Preview any theme in Theme studio, then explicitly apply it.
  Free users see an Unlock action that opens the paywall. The system/light/dark
  setting remains independent. Preferences are saved locally and retained if
  membership expires, while the rendered app falls back to Ocean.
- Material Expressive uses Google's expressive color scheme, tonal surfaces,
  rounder shapes, Google Sans Flex and Material icons within our React Native
  components. It is not the native Android Material 3 Expressive component SDK.
  Jade uses Nunito/outline icons; Dusk uses Google Sans Flex/filled icons;
  Rose uses Lora headings, Google Sans Flex body and outline icons. Fonts are
  bundled offline with their OFL licenses in `assets/fonts/`. System typography
  is used while fonts load or if loading fails.
- Android launcher icons: Original (free), Midnight, Jade, Rose, Dusk and Expressive. Aliases keep
  MainActivity enabled so notifications, deep links and widgets continue to work.
- Wear OS: native companion and Data Layer integration are implemented in `wear/`
  and `plugins/water-reminder-wear/`. See [WEAR_OS.md](WEAR_OS.md). The marketing
  flag remains **coming soon** until paired physical-watch verification and the
  Wear Play release are complete. Native phone verification supplies watch access;
  the debug-only emulator fixture is never shipped in release builds.

Widgets were previously free; this change moves existing widgets behind Plus.
Communicate that change in release notes before shipping to existing users.

## Release verification

Use a real Play testing-track installation to verify local currency, monthly and
yearly renewal amounts, one-time purchase, cancellation, pending approval,
acknowledgement, process death during checkout, restore after reinstall,
subscription expiration, refund/revocation, offline expiration and reconnect.
Confirm the premium widget cannot write after access expires, and that launcher
icon changes retain one launcher entry and working deep links.

A sideloaded development build can verify the paywall layout and locked-state
navigation, but cannot certify production Play checkout. Never use config preview
prices or a local test entitlement as proof of a successful payment.

## Paywall entry points and daily reminders

The paywall opens when a free user taps the Settings Plus banner, Unlock in a premium theme preview
or a locked app icon, the widget entry in Plus settings, a locked home-screen widget, or
a Plus notification. Membership/restore rows also open the paywall. There is no
automatic onboarding, launch, water-log or goal-completion paywall.

Settings → Notifications and Your Plus contain **Daily Plus tips & offers**.
It is opt-in, off by default, and independent of hydration reminders. After
onboarding, a successful Play catalog/ownership check, and notification permission,
free users who opt in receive one silent daily notification around **18:00 local
time**. Change the hour/minute/copy or disable the feature centrally in
`premiumConfig.promotions.dailyReminder`. Android may delay delivery in power-saving
mode. It uses a separate low-importance channel that users can mute.

One stable OS repeating schedule survives app closure. Repeated foreground
refreshes do not add duplicates. Opt-out, paid access, pending payment, denied
permission, or a failed billing refresh cancels its schedules and visible Plus
notifications. Billing changes made elsewhere are recognized on the next app
refresh; a closed/offline app cannot immediately learn of a purchase on another
device. Hydration schedules and actions are untouched. Notifications advertise
only currently available widgets, icons and themes, never unfinished Wear OS.

Notification taps support warm and cold starts and repeated daily deliveries.
Paid users tapping a stale notification go to Plus settings. Website links in
the paywall and Plus settings open the configured Lumarc Studio page with static
UTM campaign parameters, without hydration or purchase identifiers. The website
is informational; app checkout stays with Google Play. See `PREMIUM_GROWTH.md`
for prepared website copy and campaign setup.
