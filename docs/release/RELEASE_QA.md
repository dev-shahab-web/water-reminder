# Release QA

Run this checklist against a Play-installed or Play-internal-testing build where possible.

## Installation

- Fresh Play install.
- Upgrade from previous local/internal build.
- Offline launch.
- Correct icon and splash.
- No Metro, dev launcher, Expo Go, or debug overlays.

## Hydration

- Quick add.
- Custom add.
- Edit, delete, undo.
- Goal crossing and calm completion state.
- Restart persistence.
- Day rollover.

## Widget

- Add/remove widget.
- Resize widget.
- Compact, medium, expanded layouts.
- Quick actions.
- Bidirectional app/widget sync.
- App killed.
- Device reboot.
- Light/dark surfaces.

## Health Connect

- Unavailable state.
- Permission denied.
- Connect.
- First sync.
- Automatic sync after local mutation.
- Home pull-to-refresh.
- Disconnect.
- Duplicate prevention.

## Reminders

- Permission denied.
- Enabled/disabled.
- Pause/resume.
- Notification tap opens Home.
- Goal completion stops reminders.

## Firebase

- Consent default off.
- Consent on.
- Analytics events in DebugView.
- No sensitive parameters.
- Crashlytics test report.
- Consent off stops future collection.
- Telemetry failure does not affect features.

## Accessibility And UX

- TalkBack.
- Large text.
- Reduce Motion.
- Light/dark.
- Broken/missing icons.
- Hydration hero animation.
- Keyboard/modal behavior.

## Data And Legal

- Export/import.
- Reset/delete.
- Privacy/Terms links.
- Licences.
- Feedback email.
- Rate flow.
