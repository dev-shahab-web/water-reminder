# Loading States

## Purpose

Loading states should preserve trust and make the app feel responsive. Core local flows should rarely need visible loading.

## Global Rules

- Do not show loading for quick-add unless there is a real delay.
- Prefer optimistic visual feedback only when failure can be safely recovered.
- Use skeletons for lists and statistics when loading takes noticeable time.
- Use clear progress indicators for setup or save operations that cannot be instant.
- Avoid blank screens.

## Splash Loading

Pattern:

- Minimal brand or app name.
- Optional small loading indicator if startup takes longer than expected.

Copy:

- "Loading Water Reminder."

Exit:

- Onboarding, Home, or Error Recovery.

## Home Initial Load

Pattern:

- Lightweight skeleton for progress summary and quick-add area.

Rules:

- Quick-add should appear as soon as local state is ready.
- Avoid blocking Home for network state.

## Quick Add

Pattern:

- Prefer immediate feedback.
- Button may show pressed state briefly.

Optimistic updates:

- Allowed if the local write path is reliable and failure recovery is explicit.

Failure:

- Revert progress and show inline or toast-style error.

## Custom Amount Save

Pattern:

- Save button loading state if write is not immediate.

Rules:

- Disable duplicate submit while saving.
- Keep typed input visible until save succeeds.

## History Loading

Pattern:

- Skeleton list rows.

Rules:

- Show recent days first.
- Avoid loading every historical entry at once.

## Statistics Loading

Pattern:

- Skeleton chart blocks and stat cards.

Rules:

- Show text summaries when ready.
- Do not show misleading empty state while data is still loading.

## Settings Loading

Pattern:

- Inline loading for specific setting groups if needed.

Rules:

- Do not block unrelated settings.
- Save controls show loading only for the affected action.

## Permission Loading

Pattern:

- Button loading state while permission request is in progress.

Rules:

- Do not allow duplicate permission requests.
- After the system prompt resolves, show granted, denied, or fallback state.

## Backup Or Export Loading, Future

Pattern:

- Determinate progress if duration is meaningful.

Rules:

- This must remain optional and must not block core tracking.
