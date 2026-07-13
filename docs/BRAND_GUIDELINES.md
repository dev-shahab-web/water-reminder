# Brand Guidelines

## Brand Position

Water Reminder is a calm, fresh, minimal hydration companion. It should feel trustworthy, private, offline-first, and modern Android-native without becoming clinical, childish, or generically blue.

The product identity is water-inspired rather than blue-themed. Visual decisions should come from water behavior: clarity, ripples, quiet movement, surface tension, freshness, and flow.

## Brand Attributes

- Calm: supportive, never urgent.
- Fresh: light surfaces, clear hierarchy, breathable spacing.
- Minimal: progress and logging stay central.
- Trustworthy: privacy and local-first behavior are visible and accurate.
- Premium restraint: motion, haptics, and copy feel considered, not noisy.
- Android-native: follows platform expectations while preserving a distinct mark and palette.

## Visual Identity

The brand mark is a water drop with a soft ripple. It should appear as the primary app icon, splash mark, widget mark, and small in-app identity cue.

Primary source asset:

- `assets/brand/water-reminder-mark.svg`

Configured production raster assets:

- `assets/images/icon.png`
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-background.png`
- `assets/images/android-icon-monochrome.png`
- `assets/images/splash-icon.png`
- `assets/images/favicon.png`

Android adaptive icon configuration remains in `app.json`. The foreground should carry the drop/ripple mark, the background should remain light mist/aqua, and the monochrome asset should remain readable for themed Android icons.

## Color Direction

Use the existing teal, aqua, mist, moss, and night palette from the design tokens. Avoid turning the interface into a single saturated blue theme.

Preferred feeling:

- Light mode: mist background, white surfaces, teal/aqua progress, moss success.
- Dark mode: night surfaces, aqua progress, low-glare contrast.
- Widget: small mark, readable text, restrained progress color.

Avoid:

- Heavy gradients.
- Neon cyan.
- Generic medical blue.
- Purple-blue product gradients.
- Decorative blobs or unrelated wellness imagery.

## Motion Identity

Water motion is the signature visual behavior.

Approved expression:

- Gentle horizontal water surface motion.
- Low amplitude wave movement.
- Two subtle overlapping phases.
- Progress-tied water level.
- Ripple on logging.
- Calm goal completion glow.

Motion must never compete with the primary logging response. Quick-add feedback should remain under roughly 500ms for the visible confirmation moment.

Reduce Motion:

- Disable continuous water movement.
- Keep instant or very short state changes.
- Preserve progress clarity and accessible text.

## Voice And Microcopy

Voice should be short, warm, and grounded.

Use:

- "Nice work. You've finished today's hydration."
- "Every glass counts."
- "Refreshing."
- "Time for a sip."
- "Stay refreshed."

Avoid:

- Guilt.
- Urgency.
- Medical promises.
- Childish praise.
- Engagement bait.

## Widget Branding

The Android widget uses a widget-safe native vector brand mark from the config-plugin template. The widget header should show:

- Compact: brand mark only.
- Medium/expanded: brand mark plus "Water Reminder" or calm completion text.

The widget must remain readable in light and dark surfaces, stay within Jetpack Glance Row/Column limits, and preserve quick-add behavior.

## Release-Facing Principles

Store listing, screenshots, and release copy should emphasize:

- Fast water logging.
- Gentle reminders.
- Local-first privacy.
- Optional Health Connect.
- Home-screen widget convenience.
- No account required.

Do not claim medical outcomes, universal hydration needs, disease prevention, weight loss, or clinical advice.

## Trade-Offs

The brand intentionally chooses restraint over spectacle. That may make the product less visually loud in store screenshots, but it better supports trust, daily use, and the product principles.

The icon system uses generated PNG assets for Expo and native builds, while the SVG remains the editable source of truth. This adds an export step before future icon revisions, but keeps native configuration stable.
