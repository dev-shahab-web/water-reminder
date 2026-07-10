import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { logger } from '@core/logger';

export type NotificationRegistrationStatus = {
  canAskAgain: boolean;
  granted: boolean;
  status: Notifications.PermissionStatus;
};

export type LocalNotificationRequest = {
  body: string;
  date: Date;
  title: string;
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
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: 'Default',
    });
  }

  return getNotificationRegistrationStatus();
};

export const scheduleLocalNotification = async ({
  body,
  date,
  title,
}: LocalNotificationRequest): Promise<string | undefined> => {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        body,
        data: {
          source: 'hydration-reminder',
        },
        sound: false,
        title,
      },
      trigger: {
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

export const addNotificationResponseListener = (
  listener: () => void,
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.source === 'hydration-reminder') {
      listener();
    }
  });
};
