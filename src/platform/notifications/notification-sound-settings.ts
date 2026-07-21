import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import { logger } from '@core/logger';

import { ensureNotificationChannels, HYDRATION_ACTIVE_CHANNEL_ID } from './notification-channels';

const CHANNEL_NOTIFICATION_SETTINGS = 'android.settings.CHANNEL_NOTIFICATION_SETTINGS';
const APP_NOTIFICATION_SETTINGS = 'android.settings.APP_NOTIFICATION_SETTINGS';
const EXTRA_APP_PACKAGE = 'android.provider.extra.APP_PACKAGE';
const EXTRA_CHANNEL_ID = 'android.provider.extra.CHANNEL_ID';
const APPLICATION_ID = Constants.expoConfig?.android?.package ?? 'com.shahab.waterreminder';

export type NotificationSoundSettingsDestination =
  'app_notifications' | 'app_settings' | 'channel' | 'failed' | 'unsupported';

export type NotificationSoundSettingsResult = {
  destination: NotificationSoundSettingsDestination;
  opened: boolean;
};

export const openActiveReminderNotificationSettings =
  async (): Promise<NotificationSoundSettingsResult> => {
    if (Platform.OS !== 'android') {
      return {
        destination: 'unsupported',
        opened: false,
      };
    }

    await ensureNotificationChannels();

    const channelResult = await tryOpenChannelNotificationSettings();

    if (channelResult.opened) {
      return channelResult;
    }

    const appNotificationResult = await tryOpenAppNotificationSettings();

    if (appNotificationResult.opened) {
      return appNotificationResult;
    }

    return tryOpenGenericAppSettings();
  };

const tryOpenChannelNotificationSettings = async (): Promise<NotificationSoundSettingsResult> => {
  try {
    await Linking.sendIntent(CHANNEL_NOTIFICATION_SETTINGS, [
      {
        key: EXTRA_APP_PACKAGE,
        value: APPLICATION_ID,
      },
      {
        key: EXTRA_CHANNEL_ID,
        value: HYDRATION_ACTIVE_CHANNEL_ID,
      },
    ]);

    return {
      destination: 'channel',
      opened: true,
    };
  } catch (error) {
    logger.warn('Unable to open active reminder channel settings.', { error });

    return {
      destination: 'channel',
      opened: false,
    };
  }
};

const tryOpenAppNotificationSettings = async (): Promise<NotificationSoundSettingsResult> => {
  try {
    await Linking.sendIntent(APP_NOTIFICATION_SETTINGS, [
      {
        key: EXTRA_APP_PACKAGE,
        value: APPLICATION_ID,
      },
    ]);

    return {
      destination: 'app_notifications',
      opened: true,
    };
  } catch (error) {
    logger.warn('Unable to open app notification settings.', { error });

    return {
      destination: 'app_notifications',
      opened: false,
    };
  }
};

const tryOpenGenericAppSettings = async (): Promise<NotificationSoundSettingsResult> => {
  try {
    await Linking.openSettings();

    return {
      destination: 'app_settings',
      opened: true,
    };
  } catch (error) {
    logger.warn('Unable to open app settings for notification sound.', { error });

    return {
      destination: 'failed',
      opened: false,
    };
  }
};
