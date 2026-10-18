import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

import { premiumConfig } from '@core/config/premium-config';
import { logger } from '@core/logger';
import { getOnboardingState } from '@modules/onboarding/repository/onboarding-storage';
import {
  isPremiumNotification,
  PREMIUM_NOTIFICATION_CHANNEL,
  PREMIUM_NOTIFICATION_ID,
  PREMIUM_NOTIFICATION_SOURCE,
} from '@platform/notifications/premium-notification';
import { store } from '@state/store/store';
import { preferencesChanged } from '../state/premium-slice';
import { persistPremiumPreferences } from '../storage/premium-preferences';

export const ensurePremiumPromotionChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(PREMIUM_NOTIFICATION_CHANNEL, {
    name: 'Plus tips & offers',
    description: 'Optional daily reminders about Water Reminder Plus benefits.',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    enableVibrate: false,
    showBadge: false,
  });
};

const eligible = () => {
  const state = store.getState().premium;
  return (
    premiumConfig.promotions.dailyReminder.enabled &&
    state.preferences.dailyOffers &&
    !state.access.active &&
    !state.pending &&
    state.status === 'ready' &&
    state.products.length > 0 &&
    getOnboardingState().onboardingCompleted
  );
};

const reconcilePromotions = async () => {
  if (Platform.OS === 'web') return;
  const state = store.getState().premium;
  // A refresh is transient. Do not replace an existing daily alarm every time
  // the app gains focus. Positive ownership or opt-out still cancels immediately.
  if (
    state.status === 'loading' &&
    !state.access.active &&
    !state.pending &&
    state.preferences.dailyOffers
  )
    return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const own = scheduled.filter(
    (item) =>
      item.identifier === PREMIUM_NOTIFICATION_ID || isPremiumNotification(item.content.data ?? {}),
  );
  const permission = await Notifications.getPermissionsAsync();
  const config = premiumConfig.promotions.dailyReminder;
  const validTime =
    Number.isInteger(config.hour) &&
    config.hour >= 0 &&
    config.hour < 24 &&
    Number.isInteger(config.minute) &&
    config.minute >= 0 &&
    config.minute < 60;
  if (!eligible() || !permission.granted || !validTime) {
    await Promise.all(
      own.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
    );
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      presented
        .filter((item) => isPremiumNotification(item.request.content.data ?? {}))
        .map((item) => Notifications.dismissNotificationAsync(item.request.identifier)),
    );
    return;
  }
  const scheduleKey = JSON.stringify([config.hour, config.minute, config.title, config.body]);
  const existing = own.find(
    (item) =>
      item.identifier === PREMIUM_NOTIFICATION_ID && item.content.data?.scheduleKey === scheduleKey,
  );
  await Promise.all(
    own
      .filter((item) => item !== existing)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
  await ensurePremiumPromotionChannel();
  if (existing || !eligible()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: PREMIUM_NOTIFICATION_ID,
    content: {
      title: config.title,
      body: config.body,
      sound: false,
      data: { source: PREMIUM_NOTIFICATION_SOURCE, scheduleKey },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: config.hour,
      minute: config.minute,
      channelId: PREMIUM_NOTIFICATION_CHANNEL,
    },
  });
};

// Serialize scheduling and cancellation and read the latest store state inside
// each operation: a purchase/opt-out must win over an in-flight schedule.
let queue: Promise<void> = Promise.resolve();
export const syncPremiumPromotions = (): Promise<void> => {
  queue = queue.catch(() => undefined).then(reconcilePromotions);
  return queue;
};

export const changeDailyOffers = async (dailyOffers: boolean) => {
  const preferences = { ...store.getState().premium.preferences, dailyOffers };
  persistPremiumPreferences(preferences);
  store.dispatch(preferencesChanged(preferences));
  await syncPremiumPromotions();
};

export const refreshPremiumPromotions = () => {
  void syncPremiumPromotions().catch((error: unknown) =>
    logger.warn('Unable to update Plus reminders.', { error }),
  );
};

export const openPremiumWebsite = async (source: 'paywall' | 'settings') => {
  const url = new URL(premiumConfig.promotions.websiteUrl);
  url.searchParams.set('utm_source', 'water_reminder');
  url.searchParams.set('utm_medium', 'app');
  url.searchParams.set('utm_campaign', 'plus');
  url.searchParams.set('utm_content', source);
  try {
    await Linking.openURL(url.toString());
  } catch {
    Alert.alert(
      'Link unavailable',
      'Please visit lumarcstudio.com/apps/water-reminder/ in your browser.',
    );
  }
};
