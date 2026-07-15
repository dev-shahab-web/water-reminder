# Logo Specification

## Primary Mark

The Water Reminder logo is a water drop with a soft ripple. It represents a simple hydration action becoming a calm daily habit.

Current editable source:

```txt
assets/branding/source/master-logo.svg
```

## Construction

Canvas:

- Square artboard.
- Recommended master size: 1024 x 1024.
- Corner radius for app-icon background: about 22% of canvas width.

Primary geometry:

- Centered circular support field.
- Centered water drop.
- Drop height: about 58% of canvas.
- Drop width: about 36-42% of canvas.
- Apex: rounded, not sharp.
- Bowl: broad and stable.
- Baseline: visually weighted slightly below center.

Ripple:

- One horizontal curved ripple across the lower third of the drop.
- Stroke should be rounded and calm.
- Ripple should feel like a reflection or surface line, not a slash.
- Ripple must remain visible at small sizes.

Highlight:

- Optional aqua highlight inside the lower body of the drop.
- Optional pale mist highlight near the upper body.
- Highlights should support depth without making the logo complex.

## Color Variants

### Full Color Light

- Background: mist `#F7FBF8`.
- Support circle: aqua mist `#D8F3EF`.
- Drop: teal `#007A8A`.
- Interior highlight: aqua `#8DDDD3`.
- Ripple stroke: mist white `#F7FBF8` at about 70% opacity.

### Full Color Dark

- Background: night `#101816`.
- Support circle: deep teal/night `#075F68` or `#18221F`.
- Drop: aqua-teal `#1EA79B` or `#8DDDD3`.
- Ripple stroke: pale mist `#EAF3EF` at restrained opacity.

### Monochrome

- Single solid shape.
- Preserve drop silhouette and ripple negative space where possible.
- Must work as Android themed icon.

### One-Color Small Mark

- Use teal on light backgrounds.
- Use aqua or mist on dark backgrounds.
- Remove interior highlights if they reduce clarity.

## Clear Space

Minimum clear space around the standalone mark:

- 20% of mark width on every side.
- Do not place text or UI borders inside the clear-space zone.

## Minimum Sizes

- App icon: full adaptive icon system.
- In-app brand mark: 40dp minimum.
- Widget compact mark: 18-24dp minimum.
- Favicon: simplified mark; remove complex highlights if needed.

## Lockups

### Horizontal Lockup

Composition:

```txt
[brand mark] Water Reminder
```

Rules:

- Mark height should align optically with cap height plus ascenders.
- Text weight: bold or semibold.
- Gap: about 0.35-0.5x mark width.
- Use title case exactly: `Water Reminder`.

### Compact Lockup

Use mark only when space is limited, such as widget compact mode or launcher contexts.

## Do Not

- Rotate the mark.
- Add extra droplets.
- Use blue/purple gradients.
- Add shadows that blur the silhouette.
- Place the mark over busy photos.
- Use the ripple as a smile.
- Stretch or compress the drop.
- Replace the drop with a bottle, glass, wave, or medical cross.

## Image Model Reproduction Prompt

> Create a clean vector-style logo for a premium hydration reminder app. Use a centered rounded water drop in deep teal on a soft mist square background with rounded corners. Add one soft curved horizontal ripple across the lower third of the drop, pale mist stroke, rounded caps. Add subtle aqua highlight inside the drop. Minimal Material 3 Android style, calm, fresh, privacy-first, no cartoon splash, no medical symbol, no text unless requested.
