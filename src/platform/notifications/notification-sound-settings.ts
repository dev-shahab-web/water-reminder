import { Linking, Platform } from 'react-native';

import { logger } from '@core/logger';

export type NotificationSoundPickerResult = 'opened' | 'unsupported' | 'failed';

export const openDeviceNotificationSoundPicker =
  async (): Promise<NotificationSoundPickerResult> => {
    if (Platform.OS !== 'android') {
      return 'unsupported';
    }

    try {
      await Linking.openSettings();
      return 'opened';
    } catch (error) {
      logger.warn('Unable to open Android notification sound settings.', { error });
      return 'failed';
    }
  };
