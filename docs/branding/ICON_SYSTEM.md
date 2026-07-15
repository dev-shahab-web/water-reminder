# Icon System

## Purpose

Water Reminder uses icons for fast recognition and one-handed operation. Icons should make actions easier to scan without adding visual noise.

## Icon Source

Use exactly one app UI icon source:

```txt
@expo/vector-icons/MaterialCommunityIcons
```

React Native Paper should be configured to use Material Community Icons, and shared icon components should render the icon component directly where alignment matters.

## Brand Icons vs UI Icons

Brand icons:

- Water drop/ripple mark.
- App icon.
- Splash mark.
- Widget mark.
- Favicon.

UI icons:

- Settings.
- Back.
- Add.
- History.
- Statistics.
- Notifications.
- Pause.
- Edit.
- Delete.
- Sync.
- Information.
- Export/import.
- Privacy/legal/support.

Do not use the brand mark as a generic button icon. It is identity, not a control.

## Sizes

- Standard action icon: 20-22dp.
- Dense row icon: 20dp.
- Prominent card icon: 24dp.
- Brand mark in app header: about 48-52dp.
- Icon button touch target: 44-48dp.

## Alignment Rules

Icon buttons:

- Fixed square size.
- `alignItems: center`.
- `justifyContent: center`.
- No nested text wrappers.
- No internal icon padding.
- Optical center should be checked for edit/delete/settings/back icons.

Rows:

- Leading icon aligned with first line of label when supporting text exists.
- Use subtle surface container behind row icons only when it improves grouping.

## Stroke and Weight

Prefer outline icons for calm settings/actions. Use filled icons sparingly for high-signal states such as notification active or brand identity.

Avoid icons that feel:

- Aggressive.
- Medical.
- Gamified.
- Social.
- Sales-oriented.

## Approved Functional Icon Names

Use valid Material Community Icons names, including:

- `cog-outline` or `cog` for Settings.
- `water` for hydration.
- `plus` for add.
- `history` for history.
- `bell-off-outline` for disabled reminders.
- `bell-ring` for test notification.
- `pause` or `pause-circle-outline` for pause/reduce motion contexts.
- `chart-line` for statistics.
- `arrow-left` / RTL-aware mirrored back icon for back.
- `delete-outline` or `trash-can-outline` for destructive delete.
- `pencil-outline` for edit.
- `sync` for sync.
- `information-outline` for about.
- `shield-lock-outline` for privacy.
- `file-document-outline` for terms.
- `source-branch` for open-source notices.

## Color Rules

Light mode:

- Primary actions: teal `#007A8A`.
- Secondary actions: moss `#4E7B68`.
- Destructive actions: coral `#A73F2E`.
- Muted icons: night `#52685F`.

Dark mode:

- Primary actions: aqua `#8DDDD3`.
- Secondary actions: moss `#8AA897`.
- Destructive actions: coral `#D95F45`.
- Muted icons: night 300 `#8FA59B`.

## Accessibility

- Every icon-only button needs an accessible label.
- Do not rely on icon color alone for destructive or disabled states.
- Preserve 44-48dp touch target.
- Support high contrast and dark mode.

## Do Not

- Mix Lucide, custom SVG, emoji, and Material Community Icons in app UI.
- Use decorative icons inside dense operational screens.
- Use icon-only controls for unfamiliar actions without labels/tooltips where the platform supports them.
- Use water drops for every action.
