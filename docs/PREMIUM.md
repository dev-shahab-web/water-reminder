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

Only ordinary, auto-renewing monthly/yearly base plans are offered. Trial and
introductory offers are deliberately excluded so the shown amount is the full
recurring price. Annual savings are calculated from compatible prices, never
across currencies or a mixture of store and preview prices. Missing products
cannot be purchased. A missing key or unavailable store leaves the screen in a
clearly labeled preview/unavailable state, with no local unlock button.

## Google Play setup

1. Create and activate the subscription and both auto-renewing base plans above.
   Use billing periods of one month and one year. Activate the one-time product
   as a non-consumable purchase. IDs can be changed in the config.
2. Configure target countries and USD/regional prices in Play Console. Make all
   three products grant the same Plus features.
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

This implementation uses on-device Play ownership queries and signature
verification. There is no purchase-verification backend, Real-time Developer
Notifications consumer or Play Developer API subscription-expiry lookup. Refunds
and revocations take effect at the next successful ownership check or offline
window expiration. A backend is needed for cross-device server entitlements,
immediate revocation and a future watch service; never send private Developer API
credentials to the mobile app.

## Premium features

- Android widgets: enabled by verified Plus access, including background actions.
- Themes: Ocean (free), Jade, Dusk and Rose. Premium accents work with the existing
  system/light/dark preference. Preferences are saved locally.
- Android launcher icons: Original (free), Midnight, Jade and Rose. Aliases keep
  MainActivity enabled so notifications, deep links and widgets continue to work.
- Wear OS: **coming soon**. This repository has no Wear OS companion app or data
  layer. The paywall explicitly labels this benefit as unavailable. Do not set
  `features.wearOs.available` to true until the companion and its entitlement
  verification are implemented.

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
