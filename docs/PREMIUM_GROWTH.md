# Plus launch and promotions

## Recommended launch

Use both a trial and the website: a **7-day trial on monthly and yearly**, with
Google Play controlling first-time eligibility, and the Lumarc Studio page
explaining benefits and directing visitors into the app. One-time Plus remains
a paid non-consumable with no trial. USD is the base pricing strategy; each
customer sees their actual Play country/currency price.

The app already links to https://lumarcstudio.com/apps/water-reminder/ with
`utm_source=water_reminder&utm_medium=app&utm_campaign=plus` and `utm_content`
set to `paywall` or `settings`. These parameters identify the entry surface,
not an individual user. View them in the website's analytics if available.
No website changes have been deployed from this repository.

## Website copy ready to publish after Play offers are active

**Make every sip yours with Water Reminder Plus**

Keep your progress close with home screen widgets. Choose a premium app icon
and a color theme that feels like you. Your everyday hydration tracking,
reminders, history and optional Health Connect sync stay free.

**Try Plus free for 7 days**

Available to eligible first-time subscribers on monthly and yearly plans.
After your trial, your selected plan renews automatically at the local price
shown in the app and Google Play. Cancel in Google Play before the trial ends
to avoid being charged. Prefer one payment? Choose one-time Plus in the app.

Primary button: **Explore Plus in the app** → `waterreminder://paywall`

Fallback button: **Get Water Reminder on Google Play** →
https://play.google.com/store/apps/details?id=com.shahab.waterreminder

Wear OS remains **coming soon**. Do not present it as an available reason to pay.
Update the existing website widget description to explain that widgets require
Plus in this release; older versions shipped widgets free.

## Launch checks

- Activate the `trial-7-days` offer under **both** base plans. Use Play-managed
  new-customer eligibility across the app, so monthly/yearly cannot double-dip.
- Verify eligible and ineligible tester accounts, the full renewal amount,
  cancellation before conversion, post-trial access, and purchase restoration.
- Advertise prices only with regional context; website USD examples must not be
  presented as the price everyone will pay. The checkout price comes from Play.
- Publish the updated terms and privacy policy alongside campaign content.

For later seasonal campaigns, use Play Console offers or Play promo codes.
Publish truthful dates and eligibility on the website. Current app code supports
the configured single free-trial phase plus regular billing; additional paid
introductory phases require corresponding disclosure and selection support.
Do not use a website visit, arbitrary code, or local timer to grant paid access.

Official setup guidance:

- https://support.google.com/googleplay/android-developer/answer/140504
- https://support.google.com/googleplay/android-developer/answer/12154973
- https://developer.android.com/google/play/billing/subscriptions
