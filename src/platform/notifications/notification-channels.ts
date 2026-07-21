import type { NotificationChannelInput } from 'expo-notifications';
import { Platform } from 'react-native';

import { logger } from '@core/logger';

export const HYDRATION_GENTLE_CHANNEL_ID = 'hydration-gentle-v1';
export const HYDRATION_ACTIVE_CHANNEL_ID = 'hydration-active-v1';
export const HYDRATION_SNOOZE_CHANNEL_ID = 'hydration-snooze-v1';

export const hydrationReminderChannelIds = [
  HYDRATION_GENTLE_CHANNEL_ID,
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_SNOOZE_CHANNEL_ID,
] as const;

export type HydrationReminderChannelId = (typeof hydrationReminderChannelIds)[number];

export type NotificationChannelDefinition = {
  configuration: NotificationChannelInput;
  id: HydrationReminderChannelId;
};

const androidImportance = {
  DEFAULT: 5,
  LOW: 4,
} as const;

export const hydrationReminderChannelDefinitions: readonly NotificationChannelDefinition[] = [
  {
    configuration: {
      description: 'Quiet hydration reminders that stay out of your way.',
      enableVibrate: false,
      importance: androidImportance.LOW,
      name: 'Gentle hydration reminders',
      showBadge: false,
      sound: null,
    },
    id: HYDRATION_GENTLE_CHANNEL_ID,
  },
  {
    configuration: {
      description: 'More noticeable hydration reminders with system sound and vibration.',
      enableVibrate: true,
      importance: androidImportance.DEFAULT,
      name: 'Active hydration reminders',
      showBadge: false,
      sound: 'default',
      vibrationPattern: [0, 240, 160, 240],
    },
    id: HYDRATION_ACTIVE_CHANNEL_ID,
  },
  {
    configuration: {
      description: 'One-off snoozed hydration reminders. Kept quiet to avoid surprise.',
      enableVibrate: false,
      importance: androidImportance.LOW,
      name: 'Snoozed hydration reminders',
      showBadge: false,
      sound: null,
    },
    id: HYDRATION_SNOOZE_CHANNEL_ID,
  },
];

let channelSetupPromise: Promise<void> | null = null;
let channelCreator = async ({
  configuration,
  id,
}: NotificationChannelDefinition): Promise<void> => {
  const Notifications = await import('expo-notifications');

  await Notifications.setNotificationChannelAsync(id, configuration);
};

export const ensureNotificationChannels = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  if (channelSetupPromise) {
    return channelSetupPromise;
  }

  channelSetupPromise = createNotificationChannels().catch((error: unknown) => {
    channelSetupPromise = null;
    logger.warn('Unable to initialize notification channels.', { error });
  });

  return channelSetupPromise;
};

export const resetNotificationChannelInitializationForTests = (): void => {
  channelSetupPromise = null;
  channelCreator = async ({ configuration, id }: NotificationChannelDefinition): Promise<void> => {
    const Notifications = await import('expo-notifications');

    await Notifications.setNotificationChannelAsync(id, configuration);
  };
};

export const setNotificationChannelCreatorForTests = (
  creator: (definition: NotificationChannelDefinition) => Promise<void>,
): void => {
  channelCreator = creator;
};

const createNotificationChannels = async (): Promise<void> => {
  await Promise.all(hydrationReminderChannelDefinitions.map(channelCreator));
};
