# Play Console App Content Guidance

Use this document to prepare Play Console answers. Do not submit without checking the current Play Console dashboard wording.

## Privacy Policy

- Required: yes.
- URL: use the hosted `legal-site/privacy-policy.html` URL.
- Must mention optional Firebase Analytics/Crashlytics, Health Connect, local data, and diagnostics opt-in.

## Ads

- Contains ads: no.

## App Access

- All app functionality is available without login.
- No restricted credentials are required for review.

## Content Rating

Recommended category: utility / health and fitness wellness utility.

Expected answers:

- No user-generated content.
- No social features.
- No purchases or gambling.
- No medical diagnosis or treatment.
- No location sharing.

## Target Audience

Recommended target: general audience, not specifically directed to children.

Families applicability: not designed for children. Manual Play Console review required if publishing in a region/category with additional family policy prompts.

## Data Safety

Disclose:

- Optional app activity/app interactions for Firebase Analytics when diagnostics are enabled.
- Optional crash logs/diagnostics for Firebase Crashlytics when diagnostics are enabled.
- Possible device or other identifiers through Firebase SDKs, pending manual verification.
- Health Connect hydration data is processed locally and exchanged with Android Health Connect only after opt-in.
- Feedback email is user initiated.

Do not disclose hydration values as sent to telemetry or backend.

## Health Apps

- Health/fitness feature: yes, general wellness hydration tracking.
- Medical claims: no.
- Diagnosis/treatment/prevention: no.
- Health Connect permissions: hydration read/write only.
- Health data advertising/profiling: no.

## Account Deletion

Not applicable. Water Reminder has no accounts.

## News, Government, Financial, UGC

- News: no.
- Government: no.
- Financial features: no.
- User-generated content: no.

## Purchases And Subscriptions

- Purchases/subscriptions: no.

## Firebase

Firebase Analytics and Crashlytics are optional and controlled by the Settings diagnostics toggle. Crashlytics end-to-end report upload still requires manual verification before production.
