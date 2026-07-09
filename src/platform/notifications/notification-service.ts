import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotificationRegistrationStatus = {
  canAskAgain: boolean;
  granted: boolean;
  status: Notifications.PermissionStatus;
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
