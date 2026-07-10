import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotificationRegistrationStatus = {
  canAskAgain: boolean;
  granted: boolean;
  status: Notifications.PermissionStatus;
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

  const permissions = await Notifications.getPermissionsAsync();

  return {
    canAskAgain: permissions.canAskAgain,
    granted: permissions.granted,
    status: permissions.status,
  };
};
