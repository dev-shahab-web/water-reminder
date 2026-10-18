# Google Play paywall setup

Water Reminder uses Google Play Billing directly. The app needs matching product,
base-plan and trial-offer IDs, plus the app's public licensing key. Google Play
owns the real prices and returns the customer's localized price at runtime.

## 1. Complete the Google payments profile

Open [Play Console](https://play.google.com/console), then **Settings → Payments
profile**. Complete any required business, verification, tax and payout details.
Skip this if already complete. These details stay in Google; do not put them in
the app. [Google's guide](https://support.google.com/googleplay/android-developer/answer/7161426?hl=en)

## 2. Create the subscription

Select **Water Reminder**, package **`com.shahab.waterreminder`**. Open
**Monetize with Play → Products → Subscriptions → Create subscription**.

| Field      | Value                                                  |
| ---------- | ------------------------------------------------------ |
| Product ID | `water_reminder_plus`                                  |
| Name       | `Water Reminder Plus`                                  |
| Benefits   | Home screen widgets; premium themes; premium app icons |

Save it. Monthly and yearly are two base plans inside this one subscription.
All three purchase choices grant the same Plus access in the app; there is no
separate entitlement-ID configuration to enter in Google Play.

Keep Wear OS out of the available benefits until the companion is implemented.
It is currently marked **Coming soon**.
[Google's subscription guide](https://support.google.com/googleplay/android-developer/answer/140504?hl=en)

## 3. Add monthly and yearly base plans

Inside the subscription, choose **Add base plan** twice:

| Setting                 | Monthly       | Yearly        |
| ----------------------- | ------------- | ------------- |
| Base plan ID            | `monthly`     | `yearly`      |
| Type                    | Auto-renewing | Auto-renewing |
| Billing period          | Monthly       | Yearly        |
| Current sample US price | $1.99         | $12.99        |

These prices are editable samples in the code, **not finalized launch prices**.
Choose your prices, set the countries/regions, and save and activate both plans.
Use the auto-renewing periods above; prepaid and installment plans are not part
of this integration. Review Google's grace-period/account-hold settings as part
of the subscription setup and test them before launch.

## 4. Add a seven-day trial under each base plan

Add and activate an offer under **both** the monthly and yearly base plans:

| Setting     | Value                      |
| ----------- | -------------------------- |
| Offer ID    | `trial-7-days`             |
| Eligibility | New customer acquisition   |
| Restriction | Never had any subscription |
| Phase type  | Free trial                 |
| Duration    | 7 days                     |

Enable the desired regions, save, and activate. The same offer ID can be reused
under different base plans. The regular base-plan price applies after the free
phase. Do not add another paid introductory phase: the app supports one free
phase followed directly by regular billing.

Play-managed eligibility prevents another trial by switching monthly/yearly.
Do not choose developer-determined eligibility: there is no eligibility backend.
Existing/ineligible customers see the regular paid plan without a trial claim.
The one-time purchase does not have a trial.
[Google's offer explanation](https://support.google.com/googleplay/android-developer/answer/12154973?hl=en)

## 5. Create the one-time purchase

Open **Monetize with Play → Products → One-time products → Create one-time product**.

| Field                   | Value                                              |
| ----------------------- | -------------------------------------------------- |
| Product ID              | `water_reminder_plus_lifetime`                     |
| Name                    | `Water Reminder Plus — One-time`                   |
| Description             | One payment for Plus widgets, themes and app icons |
| Purchase option ID      | `buy`                                              |
| Purchase type           | Buy                                                |
| Current sample US price | $29.99                                             |

Use a standard Buy option. Keep multi-quantity off, and do not configure rental,
preorder or additional discount offers for this initial integration.
Keep the Buy option **backwards compatible**: the current code reads the default
one-time purchase details. Google marks the first Buy option this way by default.

Set regions and prices, save, and activate the purchase option. The app treats
this purchase as **non-consumable**: it never consumes it, and ownership can be
restored. The purchase option ID is not a subscription base-plan ID and does not
go into the lifetime plan's `basePlanId` field.
[Google's one-time product guide](https://support.google.com/googleplay/android-developer/answer/16430488?hl=en)

## 6. Set USD and regional prices

Use your chosen US prices as the starting point. In each plan/purchase option's
pricing section, select regions and use the price-setting controls to generate
regional prices. Review the conversions and override particular countries if
needed. The app must also be distributed in those countries.

The app displays the localized amount returned by Google Play, not a guessed
currency based on device language. Prices may differ by Play account country.
Your Google payments profile's payout currency is separate from customer prices.

`previewCurrency` and `previewPrice` in `src/core/config/premium-config.ts` are only
for the clearly labeled unavailable/preview state. **Editing them does not
change what Google charges.** Keep them aligned with your sample US prices.

New-purchase price changes in Play Console do not need an app update. The catalog
refreshes when the app resumes or the paywall opens. Existing subscribers follow
Google Play's subscription price-change rules. Regional prices are not a promise
of continuous real-time currency conversion.

## 7. Configure the public licensing key and legal links

Inside your app in Play Console, open **Monetize with Play → Monetization setup →
Licensing**. Copy the complete **Base64-encoded RSA public key**.
[Google's key-location guide](https://support.google.com/googleplay/android-developer/answer/186113?hl=en)

Add it to the project's existing `.env` file, preserving its other entries:

```dotenv
EXPO_PUBLIC_PLAY_BILLING_PUBLIC_KEY=PASTE_THE_COMPLETE_BASE64_PUBLIC_KEY_HERE
EXPO_PUBLIC_PRIVACY_POLICY_URL=YOUR_PUBLISHED_PRIVACY_POLICY_URL
EXPO_PUBLIC_TERMS_URL=YOUR_PUBLISHED_TERMS_URL
```

Keep the key on one line. Replace the URL placeholders with working HTTPS links
to the published policies, including purchase, trial, renewal and cancellation
terms. Provide the same variables in CI if the release is built there. Restart
Metro and rebuild after changing values; Expo embeds public environment variables
in the app bundle.

This is a **public verification key**. Do not put service-account JSON, private
keys, bank information or Developer API credentials in the mobile app. The
current integration does not require RevenueCat keys, an OAuth client ID, a
merchant ID, or a separate entitlement identifier.

## 8. Verify config and build the production package

The existing `src/core/config/premium-config.ts` already expects:

| Plan     | `productId`                    | `basePlanId` | `trial.offerId` | `type`  | `period` |
| -------- | ------------------------------ | ------------ | --------------- | ------- | -------- |
| Monthly  | `water_reminder_plus`          | `monthly`    | `trial-7-days`  | `subs`  | `P1M`    |
| Yearly   | `water_reminder_plus`          | `yearly`     | `trial-7-days`  | `subs`  | `P1Y`    |
| One-time | `water_reminder_plus_lifetime` | Empty        | None            | `inapp` | Empty    |

IDs must match exactly, including case. Keep `trial.days` at `7` for each trial.
If you use the IDs above, no product-ID code changes are needed. Play generates
the offer tokens; do not paste an offer token into the config.

Increase `android.versionCode` in `app.json` above the highest code already
uploaded to any Play track. Use your existing release upload-key signing setup
and production Firebase configuration. From the project's WSL terminal:

```bash
npx expo prebuild --platform android --no-install
npm run android:release
npm run android:verify-release
```

Upload the freshly generated bundle:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Do not upload a stale bundle, a debug APK, or the isolated preview package.
See [release build instructions](docs/release/AAB_BUILD.md).

## 9. Test on Google Play before production

Add the test Google account in **both** places:

1. Developer account **Settings → License testing**.
2. App **Test and release → Testing → Internal testing → Testers**.

Upload the new AAB to internal testing and make that release available. Accept
the tester invitation/opt-in link using the same account, then install or update
through Google Play. The package must be **`com.shahab.waterreminder`**, not
`com.shahab.waterreminder.premiumpreview`. Use the same Play account on the phone.

Before confirming a test transaction, verify that checkout offers a **test
payment method** such as the always-approves test card. Internal-track membership
alone does not make purchases free; license-testing enrollment is also required.

Verify all of these:

- Localized monthly, yearly and one-time prices match the Google checkout.
- Eligible users see a seven-day trial on both subscription choices, with the
  full renewal charge disclosed. Ineligible users see the paid base plans.
- Successful transactions unlock themes, typography, icons and widgets.
- Declined, canceled and pending transactions do not grant new access.
- Restore works after reinstall using the purchasing account.
- Trial cancellation, renewal, expiry, refund/revocation, grace period, account
  hold and offline access behave correctly. Test subscriptions use accelerated
  timing; Play Billing Lab can help exercise eligibility and lifecycle cases.
- Premium themes fall back to Ocean when verified access expires, and free
  users can preview themes without applying paid styles.

Use [Google's billing-testing guide](https://developer.android.com/google/play/billing/test).
The current app verifies purchases on-device and acknowledges them before granting
access. It does not have a Developer API verification backend or real-time
revocation service; refunds/revocations are recognized on the next successful
ownership refresh or after the bounded offline window expires.

## If a plan or trial does not appear

Check the licensing key, exact IDs, activated base plans/offers/purchase options,
account region, app/product distribution, correct installed package, and the
testing account. Allow time for Play catalog changes to propagate and reopen
the paywall. A missing/ineligible trial correctly falls back to regular pricing.
Unavailable products stay disabled; no preview price can trigger a local unlock.

## Website promotions

The app links to [Lumarc Studio](https://lumarcstudio.com/apps/water-reminder/) with
static campaign parameters. Keep the website informational and point visitors
to the app for checkout. Publish the seven-day trial claim only after both Play
offers are active, and disclose eligibility and renewal. Do not advertise Wear
OS as available. See [prepared campaign copy](docs/PREMIUM_GROWTH.md).

## Theme setup and the customer flow

There is no separate theme product in Play Console. A verified monthly, yearly,
trial or one-time purchase grants all Plus themes. Users go to **Settings → Your
Plus → Theme studio**, choose Ocean, Material Expressive, Jade, Dusk or Rose,
and inspect the light/dark sample. **Unlock** opens the paywall for free users;
**Apply** changes the app for verified members. After buying/restoring, tap **Explore Plus**
to return to the selected preview, then tap **Apply**. Launcher icons are chosen separately
under **Premium app icons**.

Themes include complete color palettes, bundled fonts and in-app icon styles.
Font licenses live in `assets/fonts/`. The existing light/dark/system setting
remains independent. Premium style preferences survive app restarts; expired
access displays Ocean until verified access is restored. No local preference,
preview price or theme tap grants a purchase.

The paywall also opens from the Settings Plus banner, locked widgets and app
icons, membership/restore rows, and opted-in Plus notification taps. It does not
interrupt app launch, water logging or goal completion. Promotional notifications
are opt-in; feedback and update settings are documented in
[APP_ENGAGEMENT.md](docs/APP_ENGAGEMENT.md).
