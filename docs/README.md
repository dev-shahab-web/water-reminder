# Documentation

This directory serves two purposes:

1. GitHub Pages source for the Water Reminder legal/privacy website.
2. Product, architecture, compliance, and engineering documentation.

## GitHub Pages Privacy Website

Static site files:

- `index.html`
- `privacy-policy.html`
- `support.html`
- `terms.html`
- `styles.css`
- `404.html`
- `robots.txt`
- `sitemap.xml`
- `.nojekyll`

The site uses only local HTML/CSS. It does not load analytics, cookies, external fonts, CDN assets, or third-party scripts.

## GitHub Pages Setup

1. Push the repository to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings` -> `Pages`.
4. Set `Build and deployment` source to `Deploy from a branch`.
5. Select branch `main`.
6. Select folder `/docs`.
7. Save.
8. Wait for GitHub Pages to publish.

Expected privacy-policy URL:

```txt
https://dev-shahab-web.github.io/water-reminder/privacy-policy.html
```

Expected support URL:

```txt
https://dev-shahab-web.github.io/water-reminder/support.html
```

For the detected repository `https://github.com/dev-shahab-web/water-reminder`, the likely GitHub Pages base URL is:

```txt
https://dev-shahab-web.github.io/water-reminder
```

Confirm the actual URL in GitHub Pages settings before using it in Google Play.

## Configured Contact And URLs

Current support email:

```txt
waterreminder.help@gmail.com
```

Current GitHub Pages base URL:

```txt
https://dev-shahab-web.github.io/water-reminder
```

If these values change, update:

- `index.html`
- `privacy-policy.html`
- `support.html`
- `terms.html`
- `robots.txt`
- `sitemap.xml`
- Google Play Privacy Policy and support URLs.
- App release environment variables if used.
- Any Play Console contact/support fields.

## Test Locally

From the repository root:

```sh
cd docs
python3 -m http.server 8080
```

Then open:

```txt
http://localhost:8080/
http://localhost:8080/privacy-policy.html
http://localhost:8080/support.html
http://localhost:8080/terms.html
```

If Python is unavailable, any static file server can be used. Do not add a framework or dependency just to preview the legal site.

## Advertising Reminder

Water Reminder currently does not display advertisements and does not use AdMob.

Before enabling AdMob, advertising, or additional third-party SDKs:

- Update `privacy-policy.html`.
- Update this README if setup changes.
- Update Google Play Data Safety.
- Update Play Console App Content disclosures.
- Verify health data is not used for advertising, profiling, or sale.

## Play Store Badge

Do not add a Google Play badge until the app is actually published.

After launch, add an official `Get it on Google Play` badge to `index.html` and link it to the final Play Store listing URL.

## Documentation Index

- [Architecture](./architecture.md)
- [Architecture Freeze](./ARCHITECTURE.md)
- [Engineering Principles](./ENGINEERING_PRINCIPLES.md)
- [Bootstrap Lifecycle](./BOOTSTRAP_LIFECYCLE.md)
- [Component Guidelines](./COMPONENT_GUIDELINES.md)
- [Theme Guidelines](./THEME_GUIDELINES.md)
- [State Management](./STATE_MANAGEMENT.md)
- [Database Guidelines](./DATABASE_GUIDELINES.md)
- [Network Guidelines](./NETWORK_GUIDELINES.md)
- [Notification Architecture](./NOTIFICATION_ARCHITECTURE.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Feature Creation Guide](./FEATURE_CREATION_GUIDE.md)
- [AI Collaboration](./AI_COLLABORATION.md)
- [Quality Guidelines](./QUALITY_GUIDELINES.md)
- [Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)
- [Performance Guidelines](./PERFORMANCE_GUIDELINES.md)
- [Platform Audit](./PLATFORM_AUDIT.md)
- [Diagrams](./diagrams/README.md)
- [Setup](./setup.md)
- [Development](./development.md)
- [Design](./design.md)
- [Project Structure](./project-structure.md)
- [Conventions](./conventions/README.md)
- [Quality](./quality/README.md)
- [Decisions](./decisions/README.md)
- [Architecture Decision Records](./adr/README.md)
