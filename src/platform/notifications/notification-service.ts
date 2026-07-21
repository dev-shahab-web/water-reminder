import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { logger } from '@core/logger';

import {
  DEFAULT_NOTIFICATION_ACTION,
  REMINDER_ACTION_DISMISS,
  REMINDER_ACTION_DRINK,
  REMINDER_ACTION_SNOOZE,
  REMINDER_NOTIFICATION_CATEGORY,
  isReminderNotificationData,
  reminderNotificationActionLabels,
} from './notification-actions';
import {
  ensureNotificationChannels,
  type HydrationReminderChannelId,
} from './notification-channels';

export type NotificationRegistrationStatus = {
  canAskAgain: boolean;
  granted: boolean;
  status: Notifications.PermissionStatus;
};

export type LocalNotificationRequest = {
  androidChannelId?: HydrationReminderChannelId;
  body: string;
  categoryIdentifier?: string;
  data?: Record<string, unknown>;
  date: Date;
  identifier?: string;
  sound?: false | 'default';
  title: string;
  vibrate?: number[];
};

export type NotificationResponsePayload = {
  actionIdentifier: string;
  data: Record<string, unknown>;
  notificationIdentifier: string;
};

export const requestNotificationPermissions = async (): Promise<NotificationRegistrationStatus> => {
  const existingPermissions = await Notifications.getPermissionsAsync();

  if (existingPermissions.granted || !existingPermissions.canAskAgain) {
    return {
      canAskAgain: existingPermissions.canAskAgain,
      granted: existingPermissions.granted,
      status: existingPermissions.status,
    };
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();

  return {
    canAskAgain: requestedPermissions.canAskAgain,
    granted: requestedPermissions.granted,
    status: requestedPermissions.status,
  };
};

export const getNotificationRegistrationStatus =
  async (): Promise<NotificationRegistrationStatus> => {
    const permissions = await Notifications.getPermissionsAsync();

    return {
      canAskAgain: permissions.canAskAgain,
      granted: permissions.granted,
      status: permissions.status,
    };
  };

export const initializeNotifications = async (): Promise<NotificationRegistrationStatus> => {
  await initializeNotificationInfrastructure();

  return getNotificationRegistrationStatus();
};

let categorySetupPromise: Promise<void> | null = null;

export const initializeNotificationInfrastructure = async (): Promise<void> => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldPlaySound: notification.request.content.sound === 'default',
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  await Promise.all([ensureNotificationChannels(), ensureNotificationCategories()]);
};

export const ensureNotificationCategories = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  if (categorySetupPromise) {
    return categorySetupPromise;
  }

  categorySetupPromise = Notifications.setNotificationCategoryAsync(
    REMINDER_NOTIFICATION_CATEGORY,
    [
      {
        buttonTitle: reminderNotificationActionLabels[REMINDER_ACTION_DRINK],
        identifier: REMINDER_ACTION_DRINK,
        options: {
          opensAppToForeground: true,
        },
      },
      {
        buttonTitle: reminderNotificationActionLabels[REMINDER_ACTION_SNOOZE],
        identifier: REMINDER_ACTION_SNOOZE,
        options: {
          opensAppToForeground: true,
        },
      },
      {
        buttonTitle: reminderNotificationActionLabels[REMINDER_ACTION_DISMISS],
        identifier: REMINDER_ACTION_DISMISS,
        options: {
          opensAppToForeground: false,
        },
      },
    ],
  )
    .then(() => undefined)
    .catch((error: unknown) => {
      categorySetupPromise = null;
      logger.warn('Unable to initialize notification categories.', { error });
    });

  return categorySetupPromise;
};

export const resetNotificationCategoryInitializationForTests = (): void => {
  categorySetupPromise = null;
};

export const scheduleLocalNotification = async ({
  androidChannelId,
  body,
  categoryIdentifier,
  data,
  date,
  identifier,
  sound = false,
  title,
  vibrate,
}: LocalNotificationRequest): Promise<string | undefined> => {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        body,
        data: data ?? {
          source: 'hydration-reminder',
        },
        ...(categoryIdentifier === undefined ? {} : { categoryIdentifier }),
        ...(vibrate === undefined ? {} : { vibrate }),
        sound,
        title,
      },
      ...(identifier === undefined ? {} : { identifier }),
      trigger: {
        ...(androidChannelId === undefined ? {} : { channelId: androidChannelId }),
        date,
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      },
    });
  } catch (error) {
    logger.warn('Unable to schedule local notification.', { error });
    return undefined;
  }
};

export const cancelLocalNotifications = async (identifiers: readonly string[]): Promise<void> => {
  await Promise.all(
    identifiers.map(async (identifier) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch (error) {
        logger.warn('Unable to cancel scheduled notification.', { error, identifier });
      }
    }),
  );
};

export const dismissPresentedNotification = async (identifier: string): Promise<void> => {
  try {
    await Notifications.dismissNotificationAsync(identifier);
  } catch (error) {
    logger.warn('Unable to dismiss notification.', { error, identifier });
  }
};

export const addNotificationResponseListener = (
  listener: (response: NotificationResponsePayload) => void,
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;

    if (data?.source === 'hydration-reminder' || isReminderNotificationData(data)) {
      listener({
        actionIdentifier: response.actionIdentifier,
        data,
        notificationIdentifier: response.notification.request.identifier,
      });
    }
  });
};

export const isDefaultNotificationAction = (actionIdentifier: string): boolean => {
  return actionIdentifier === DEFAULT_NOTIFICATION_ACTION;
};
