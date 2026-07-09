# Feature List

## MVP Features

### Onboarding

- Unit selection.
- Daily goal setup.
- Wake and sleep time setup.
- Reminder opt-in setup.
- Notification permission education.

### Home Dashboard

- Today's progress ring or progress bar.
- Consumed amount.
- Remaining amount.
- Goal amount.
- Quick-add drink buttons.
- Custom amount entry.
- Today's log list entry point.

### Hydration Logging

- Create drink entry.
- Edit drink entry.
- Delete drink entry.
- Recalculate daily total.
- Support milliliters and ounces.

### Reminder Management

- Configure active reminder window.
- Configure reminder interval.
- Enable or disable reminders.
- Pause reminders for today.
- Reschedule reminders when settings change.

### History

- Recent daily totals.
- Goal met / missed state.
- Day detail with entries.

### Settings

- Goal settings.
- Unit settings.
- Quick-add settings.
- Reminder settings.
- Privacy and local data information.

## Future Features

- Weekly and monthly insights.
- Goal presets.
- Beverage types.
- Health Connect / Apple Health integration.
- Data export.
- Cloud sync.
- Widgets.
- Wearable companion.
- Smart reminders based on progress pace.
- Premium themes and advanced reminder schedules.

## Assumptions

- MVP should validate the daily habit loop before adding integrations.
- All MVP features can be built offline-first.
- Feature modules should remain product-owned and call platform services through existing boundaries.
- Visual analytics can be simple for v1.

## Edge Cases

- Reminder scheduling limits may vary by OS.
- Large histories may require pagination or date-window queries.
- Quick-add buttons can overflow on small screens or large font sizes.
- Progress may exceed 100 percent and should still display gracefully.
- Custom amount inputs may conflict with locale decimal formatting.

## Suggested Improvements

- Add a "favorite bottle" quick-add model if users often log the same container.
- Add a "vacation / fasting / sick day" reminder pause reason later if research supports it.
- Consider a lock-screen widget only after core retention is proven.
- Add data import/export for trust before account-based sync.

## Trade-Offs

- A broad MVP can feel complete, but a narrower habit loop may ship faster.
- Smart reminders sound differentiated, but fixed reminders are easier to trust and verify.
- Beverage types improve realism, but complicate copy, hydration multipliers, and health disclaimers.
- Widgets can improve logging speed, but add platform-specific maintenance.
