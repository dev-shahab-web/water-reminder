// Google Play decides which update is available to each account/device/track.
export const engagementConfig = {
  playPackage: 'com.shahab.waterreminder',
  review: {
    firstReminderDays: 5,
    repeatDays: 7,
    title: 'How is Water Reminder working for you?',
    body: 'Share an honest review on Google Play. Your feedback helps us improve.',
  },
  updates: {
    backgroundCheckHours: 12,
    promptSnoozeHours: 24,
    title: 'A new Water Reminder update is ready',
    body: 'Open the app to update securely with Google Play.',
  },
} as const;
