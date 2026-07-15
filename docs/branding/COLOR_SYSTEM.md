# Material 3 Color System

## Palette Philosophy

Water Reminder is not a blue app. It is a water app. The palette uses teal and aqua for hydration, mist for freshness, night for trust and dark mode, moss for natural secondary actions, and coral only for errors/destructive states.

## Core Palette

| Token     | Hex       | Role                                    |
| --------- | --------- | --------------------------------------- |
| Mist 50   | `#F7FBF8` | Light app background, splash background |
| Mist 100  | `#EEF8F5` | Light muted surface                     |
| Mist 200  | `#DFF1EC` | Light border/container                  |
| Mist 300  | `#C7E6DE` | Soft dividers/highlights                |
| Teal 100  | `#D8F3EF` | Primary container                       |
| Teal 300  | `#8DDDD3` | Dark primary, water highlight           |
| Teal 500  | `#1EA79B` | Hydration progress                      |
| Teal 600  | `#007A8A` | Light primary, logo drop                |
| Teal 700  | `#075F68` | Dark primary container                  |
| Moss 400  | `#8AA897` | Dark secondary/success                  |
| Moss 600  | `#4E7B68` | Light secondary/success                 |
| Moss 700  | `#345E4F` | Deep natural accent                     |
| Night 50  | `#EAF3EF` | Dark text                               |
| Night 300 | `#8FA59B` | Dark secondary text                     |
| Night 500 | `#52685F` | Light secondary text                    |
| Night 700 | `#26352F` | Dark border/container                   |
| Night 800 | `#18221F` | Dark surface                            |
| Night 900 | `#101816` | Dark background                         |
| Coral 500 | `#D95F45` | Dark error                              |
| Coral 700 | `#A73F2E` | Light error                             |
| Sand 300  | `#E8D7B9` | Dark warning                            |

## Light Theme Material 3 Mapping

| Material Role        | Color     |
| -------------------- | --------- |
| `primary`            | `#007A8A` |
| `onPrimary`          | `#FFFFFF` |
| `primaryContainer`   | `#D8F3EF` |
| `secondary`          | `#4E7B68` |
| `secondaryContainer` | `#DFF1EC` |
| `background`         | `#F7FBF8` |
| `surface`            | `#FFFFFF` |
| `surfaceVariant`     | `#EEF8F5` |
| `onBackground`       | `#101816` |
| `onSurface`          | `#101816` |
| `onSurfaceVariant`   | `#52685F` |
| `outline`            | `#DFF1EC` |
| `error`              | `#A73F2E` |

## Dark Theme Material 3 Mapping

| Material Role        | Color     |
| -------------------- | --------- |
| `primary`            | `#8DDDD3` |
| `onPrimary`          | `#101816` |
| `primaryContainer`   | `#075F68` |
| `secondary`          | `#8AA897` |
| `secondaryContainer` | `#26352F` |
| `background`         | `#101816` |
| `surface`            | `#18221F` |
| `surfaceVariant`     | `#26352F` |
| `onBackground`       | `#EAF3EF` |
| `onSurface`          | `#EAF3EF` |
| `onSurfaceVariant`   | `#8FA59B` |
| `outline`            | `#26352F` |
| `error`              | `#D95F45` |

## Semantic Roles

| Semantic Role      | Light     | Dark      |
| ------------------ | --------- | --------- |
| Surface base       | `#F7FBF8` | `#101816` |
| Surface subtle     | `#EEF8F5` | `#26352F` |
| Text primary       | `#101816` | `#EAF3EF` |
| Text secondary     | `#52685F` | `#8FA59B` |
| Hydration progress | `#1EA79B` | `#8DDDD3` |
| Hydration complete | `#4E7B68` | `#8AA897` |
| Hydration paused   | `#8E735B` | `#E7D9C4` |
| Warning            | `#9A6700` | `#E8D7B9` |
| Error              | `#A73F2E` | `#D95F45` |

## Water Rendering Colors

Light mode:

- Base water: aqua/teal gradient from `#8DDDD3` to `#1EA79B`.
- Front wave: `#8DDDD3`, opacity 0.30-0.40.
- Rear wave: `#007A8A`, opacity 0.15-0.25.
- Surface highlight: white/mist, opacity 0.35-0.55.

Dark mode:

- Base water: deep translucent teal, not black.
- Front wave: aqua `#8DDDD3`, opacity 0.22-0.32.
- Rear wave: teal `#075F68` or `#1EA79B`, opacity 0.10-0.18.
- Surface highlight: `#EAF3EF`, opacity 0.20-0.35.

## Gradients

Use gradients only to express depth or water:

- Mist background gradient: `#F7FBF8` to `#EEF8F5`.
- Water body gradient: lighter at top, deeper at bottom.
- Dark surface gradient: `#18221F` to `#101816`.

Avoid broad marketing gradients, purple-blue gradients, neon cyan, and one-note teal pages.

## Contrast Rules

- Primary text must remain readable over water.
- Do not place secondary text over moving water unless contrast is verified.
- Destructive coral must not be used on low-contrast teal backgrounds.
- Widget colors must be tested on light and dark launcher surfaces.

## Image Model Color Prompt

> Use a calm Material 3 teal/mist/night palette: deep teal #007A8A, aqua #8DDDD3, mist #F7FBF8, dark night #101816, moss #4E7B68. Avoid neon blue, purple gradients, medical blue, and saturated beach colors.
