export const DEFAULT_NOTIFICATION_ACTION = 'expo.modules.notifications.actions.DEFAULT';
export const REMINDER_ACTION_DRINK = 'water_reminder.reminder.drink';
export const REMINDER_ACTION_SNOOZE = 'water_reminder.reminder.snooze';
export const REMINDER_ACTION_DISMISS = 'water_reminder.reminder.dismiss';
export const REMINDER_NOTIFICATION_CATEGORY = 'water_reminder.hydration_reminder.v1';

export const reminderActionIdentifiers = [
  REMINDER_ACTION_DRINK,
  REMINDER_ACTION_SNOOZE,
  REMINDER_ACTION_DISMISS,
] as const;

export type ReminderNotificationActionIdentifier = (typeof reminderActionIdentifiers)[number];

export type ReminderNotificationData = {
  occurrenceId?: string;
  schemaVersion: 1;
  source: 'scheduled' | 'snoozed';
  type: 'hydration_reminder';
};

const reminderActionIdentifierSet = new Set<string>(reminderActionIdentifiers);

export const isReminderNotificationActionIdentifier = (
  value: unknown,
): value is ReminderNotificationActionIdentifier => {
  return typeof value === 'string' && reminderActionIdentifierSet.has(value);
};

export const isReminderNotificationData = (value: unknown): value is ReminderNotificationData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const data = value as Partial<Record<keyof ReminderNotificationData, unknown>>;
  const hasValidOccurrenceId =
    data.occurrenceId === undefined || typeof data.occurrenceId === 'string';

  return (
    data.type === 'hydration_reminder' &&
    data.schemaVersion === 1 &&
    (data.source === 'scheduled' || data.source === 'snoozed') &&
    hasValidOccurrenceId
  );
};

export const buildReminderNotificationData = ({
  occurrenceId,
  source,
}: {
  occurrenceId?: string;
  source: ReminderNotificationData['source'];
}): ReminderNotificationData => ({
  ...(occurrenceId === undefined ? {} : { occurrenceId }),
  schemaVersion: 1,
  source,
  type: 'hydration_reminder',
});

// Runtime notification category labels currently have no app-wide i18n registry.
// Keep these isolated here so future localization can replace one boundary.
export const reminderNotificationActionLabels: Record<
  ReminderNotificationActionIdentifier,
  string
> = {
  [REMINDER_ACTION_DISMISS]: 'Dismiss',
  [REMINDER_ACTION_DRINK]: 'Drink',
  [REMINDER_ACTION_SNOOZE]: 'Snooze',
};
