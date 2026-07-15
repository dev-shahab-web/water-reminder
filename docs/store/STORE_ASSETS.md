# Store Assets

Do not generate graphics during this audit. Use this checklist for final asset production.

## Required Assets

| Asset              | Requirement                  | Status                                                               |
| ------------------ | ---------------------------- | -------------------------------------------------------------------- |
| Play icon          | 512 x 512 PNG                | Create/export from final brand mark; verify no alpha if Play rejects |
| Feature graphic    | 1024 x 500 PNG/JPG           | Create manually; calm water-inspired brand, no medical claims        |
| Phone screenshots  | 6-8 portrait screenshots     | Capture from release build only                                      |
| Privacy policy URL | HTTPS hosted URL             | Manual hosting required                                              |
| Terms URL          | HTTPS hosted URL recommended | Manual hosting required                                              |

## Visual Rules

- Actual app UI only for screenshots.
- No development indicators, Metro UI, debug banners, or Expo launcher.
- No private notifications, emails, health data, contacts, or personal photos.
- Clean status bar.
- Balance light and dark theme.
- Include widget and Health Connect screenshots if policy review benefits.
- Diagnostics privacy screenshot is optional and useful if it shows clear consent.

## Manual Asset Review

- Verify adaptive icon on light/dark launchers.
- Verify monochrome icon on themed Android icons.
- Verify notification icon if notifications are used in screenshots.
- Verify widget mark at compact size.

## Final Repository Paths

- Play icon: `assets/branding/store/play-store-icon.png`
- Feature graphic: `assets/branding/store/feature-graphic.png`
- GitHub banner: `assets/branding/github/github-banner.png`

Store-only graphics must not be referenced from runtime app configuration.
