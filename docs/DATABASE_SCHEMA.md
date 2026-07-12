# Database Schema

## Purpose

Water Reminder needs local persistence for settings, drink entries, daily totals, reminder state, and optional Health Connect metadata. Product data must remain offline-first and implemented through repository and migration boundaries.

## Current Implementation

The current SQLite system of record is `hydration_entries`.

| Column                      | Type             | Notes                                                         |
| --------------------------- | ---------------- | ------------------------------------------------------------- |
| id                          | TEXT PRIMARY KEY | Local Water Reminder id.                                      |
| timestamp                   | TEXT NOT NULL    | ISO timestamp for when hydration was logged.                  |
| amount                      | INTEGER NOT NULL | Canonical milliliters, greater than zero.                     |
| source                      | TEXT NOT NULL    | `quick_add`, `custom`, `edit`, `health_connect`, or `widget`. |
| createdAt                   | TEXT NOT NULL    | ISO creation timestamp.                                       |
| updatedAt                   | TEXT NOT NULL    | ISO update timestamp.                                         |
| healthConnectRecordId       | TEXT UNIQUE NULL | Android Health Connect record id when known.                  |
| healthConnectClientRecordId | TEXT UNIQUE NULL | Client id used for Health Connect duplicate prevention.       |
| healthConnectDataOrigin     | TEXT NULL        | Origin package supplied by Health Connect when available.     |
| healthConnectSyncedAt       | TEXT NULL        | Last local sync timestamp for explainability.                 |

Indexes:

- `idx_hydration_entries_timestamp`
- `idx_hydration_entries_health_connect_record`
- `idx_hydration_entries_health_connect_client_record`

Health Connect metadata is optional. Core hydration tracking must continue when these fields are empty.

### widget_actions

Stores processed Android widget quick-add actions so repeated launcher callbacks cannot duplicate a tap.

| Column    | Type             | Notes                                                                     |
| --------- | ---------------- | ------------------------------------------------------------------------- |
| actionId  | TEXT PRIMARY KEY | Stable action id generated from the widget snapshot and quick-add amount. |
| amount    | INTEGER NOT NULL | Milliliters requested by the widget action.                               |
| createdAt | TEXT NOT NULL    | ISO timestamp for when the action was processed locally.                  |

Widget actions write to `hydration_entries` with `source = widget`. They must remain local, offline-first, and safe when React Native is not running.

## Proposed Tables

### hydration_settings

Stores user hydration preferences.

| Column                    | Type             | Notes                                    |
| ------------------------- | ---------------- | ---------------------------------------- |
| id                        | TEXT PRIMARY KEY | Single row, stable id such as `default`. |
| daily_goal_ml             | INTEGER NOT NULL | Canonical storage in milliliters.        |
| preferred_unit            | TEXT NOT NULL    | `ml` or `oz`.                            |
| wake_time_local           | TEXT NOT NULL    | `HH:mm` local time.                      |
| sleep_time_local          | TEXT NOT NULL    | `HH:mm` local time.                      |
| reminders_enabled         | INTEGER NOT NULL | Boolean as 0/1.                          |
| reminder_interval_minutes | INTEGER NOT NULL | Minimum product-defined value required.  |
| paused_until_local_date   | TEXT NULL        | `YYYY-MM-DD` when paused for the day.    |
| onboarding_completed_at   | TEXT NULL        | ISO timestamp.                           |
| created_at                | TEXT NOT NULL    | ISO timestamp.                           |
| updated_at                | TEXT NOT NULL    | ISO timestamp.                           |

### drink_entries

Stores raw logged drinks.

| Column     | Type             | Notes                                            |
| ---------- | ---------------- | ------------------------------------------------ |
| id         | TEXT PRIMARY KEY | UUID or platform-approved id.                    |
| amount_ml  | INTEGER NOT NULL | Canonical storage in milliliters.                |
| logged_at  | TEXT NOT NULL    | ISO timestamp.                                   |
| local_date | TEXT NOT NULL    | `YYYY-MM-DD` derived from local time at logging. |
| source     | TEXT NOT NULL    | `quick_add`, `custom`, `edit`, future sources.   |
| note       | TEXT NULL        | Reserved for future use.                         |
| created_at | TEXT NOT NULL    | ISO timestamp.                                   |
| updated_at | TEXT NOT NULL    | ISO timestamp.                                   |
| deleted_at | TEXT NULL        | Optional soft delete if chosen.                  |

Indexes:

- `idx_drink_entries_local_date`
- `idx_drink_entries_logged_at`

### quick_add_options

Stores custom quick-add amounts.

| Column     | Type             | Notes              |
| ---------- | ---------------- | ------------------ |
| id         | TEXT PRIMARY KEY | Stable id.         |
| amount_ml  | INTEGER NOT NULL | Canonical storage. |
| sort_order | INTEGER NOT NULL | Display order.     |
| is_enabled | INTEGER NOT NULL | Boolean as 0/1.    |
| created_at | TEXT NOT NULL    | ISO timestamp.     |
| updated_at | TEXT NOT NULL    | ISO timestamp.     |

### daily_hydration_summary

Optional denormalized table for faster history.

| Column      | Type             | Notes                       |
| ----------- | ---------------- | --------------------------- |
| local_date  | TEXT PRIMARY KEY | `YYYY-MM-DD`.               |
| total_ml    | INTEGER NOT NULL | Sum of non-deleted entries. |
| goal_ml     | INTEGER NOT NULL | Goal snapshot for that day. |
| entry_count | INTEGER NOT NULL | Number of active entries.   |
| updated_at  | TEXT NOT NULL    | ISO timestamp.              |

## Data Rules

- Store amounts canonically in milliliters.
- Convert ounces only for display and input normalization.
- Preserve raw entries so edits and history remain auditable.
- Snapshot the daily goal in summaries so historical goal completion remains meaningful.
- Use transactions when writing an entry and updating a summary together.

## Assumptions

- SQLite is the system of record for product data.
- MMKV can be considered for ephemeral UI preferences, but hydration logs belong in SQLite.
- Dates use local-date semantics for daily habit tracking.
- Schema migrations will be required before implementation.

## Edge Cases

- Unit conversion can introduce rounding differences.
- Days across daylight saving time may have unusual reminder windows.
- Users may change goal after entries exist for the current day.
- Soft delete simplifies recovery and audit but complicates queries.
- A night-shift user may expect the day to reset at sleep time instead of midnight.

## Suggested Improvements

- Add a `day_boundary_strategy` setting if night-shift support becomes first-class.
- Add `timezone_at_log` if travel behavior needs historical precision.
- Add a migration test harness before product schema changes.
- Consider deriving daily summaries on read for MVP, then denormalizing if performance requires it.

## Trade-Offs

- Canonical milliliter storage keeps data consistent, but ounce users may see rounded values.
- Denormalized summaries improve history performance, but require careful transaction logic.
- Soft deletes help with recovery and analytics, but physical deletes keep MVP simpler.
- Local-date tracking matches user expectations, but time zone changes are inherently tricky.
