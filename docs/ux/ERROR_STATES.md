# Error States

## Purpose

Errors should be clear, recoverable, and calm. The user should understand what happened, what was preserved, and what to do next.

## Global Rules

- Do not blame the user.
- Preserve entered data when possible.
- Provide one clear recovery action.
- Keep core manual tracking available whenever possible.
- Avoid exposing technical error codes unless needed for support.

## Offline

When:

- A future online-only feature is unavailable.

Message:

- "You're offline."

Secondary:

- "Water tracking still works. Online features will update when you're connected."

Recovery path:

- Continue using core app.
- Retry online feature when connection returns.

Notes:

- Offline is not an error for core usage.

## Database Error

When:

- Local data cannot be read or written.

Message:

- "We couldn't save that."

Secondary:

- "Your action did not complete. Please try again."

Recovery path:

- Retry.
- Return Home.
- If repeated, show support guidance in About or Error Recovery.

Notes:

- Do not show success feedback until write is accepted or safely queued.

## Permission Denied

When:

- User denies notification permission or permission is revoked.

Message:

- "Notifications are blocked."

Secondary:

- "You can still track water manually. Enable notifications in system settings to receive reminders."

Recovery path:

- Open system settings if supported.
- Continue without reminders.

Notes:

- Do not repeatedly prompt after denial.

## Notification Unavailable

When:

- Device or OS cannot schedule reminders.

Message:

- "Reminders are unavailable right now."

Secondary:

- "Manual tracking still works. Check your device notification settings or try again later."

Recovery path:

- Retry scheduling.
- Continue manually.

Notes:

- Keep reminder settings visible but clearly disabled.

## Validation Error

When:

- Goal or amount input is invalid.

Message examples:

- "Enter an amount greater than zero."
- "That amount looks too high. Check it before saving."

Recovery path:

- Focus invalid field.
- Preserve typed value.

Notes:

- Use inline errors near the field.

## Unexpected Error

When:

- An unclassified error prevents current screen completion.

Message:

- "Something went wrong."

Secondary:

- "Please try again. Your saved hydration history should remain on this device."

Recovery path:

- Retry.
- Return Home.

Notes:

- Avoid alarming copy.
- If crash reporting is added later, respect privacy decisions.

## Data Reset Error

When:

- Reset today's progress fails.

Message:

- "Today's progress was not reset."

Secondary:

- "Please try again."

Recovery path:

- Retry.
- Cancel.

Notes:

- Never partially hide entries if reset fails.
