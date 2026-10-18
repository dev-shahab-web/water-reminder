export const PREMIUM_NOTIFICATION_SOURCE = 'premium-upgrade';
export const PREMIUM_NOTIFICATION_ID = 'water-reminder.plus.daily.v1';
export const PREMIUM_NOTIFICATION_CHANNEL = 'water-reminder-plus-offers-v1';

export const isPremiumNotification = (data: Record<string, unknown>): boolean =>
  data.source === PREMIUM_NOTIFICATION_SOURCE;
