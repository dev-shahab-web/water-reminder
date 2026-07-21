export const reminderNotificationTitle = 'Water Reminder';

export const reminderCopyCatalog = {
  almost_there: 'Almost there.',
  little_water_refresh: 'A little water can help you feel refreshed.',
  nice_rhythm_today: 'Nice rhythm today.',
  small_sip_keep_habit: 'A small sip can keep the habit going.',
  small_sip_steady: 'Small sip, steady habit.',
  stay_refreshed: 'Stay refreshed.',
  take_moment_hydrate: 'Take a moment to hydrate.',
  time_for_sip: 'Time for a sip.',
} as const;

export type ReminderCopyKey = keyof typeof reminderCopyCatalog;

export const resolveReminderCopy = (copyKey: ReminderCopyKey): string => {
  return reminderCopyCatalog[copyKey];
};
