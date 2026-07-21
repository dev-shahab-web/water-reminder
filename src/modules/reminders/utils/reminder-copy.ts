export const reminderNotificationTitle = 'Water Reminder';

export const reminderCopyCatalog = {
  little_water_refresh: 'A little water can help you feel refreshed.',
  small_sip_steady: 'Small sip, steady habit.',
  take_moment_hydrate: 'Take a moment to hydrate.',
  time_for_sip: 'Time for a sip.',
} as const;

export type ReminderCopyKey = keyof typeof reminderCopyCatalog;

export const resolveReminderCopy = (copyKey: ReminderCopyKey): string => {
  return reminderCopyCatalog[copyKey];
};
