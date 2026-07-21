import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Linking, Platform } from 'react-native';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  resetNotificationChannelInitializationForTests,
  setNotificationChannelCreatorForTests,
} from './notification-channels';
import { openActiveReminderNotificationSettings } from './notification-sound-settings';

const mockSendIntent = jest.spyOn(Linking, 'sendIntent');
const mockOpenSettings = jest.spyOn(Linking, 'openSettings');
const mockCreateChannel = jest.fn(async () => undefined);

const setPlatform = (os: typeof Platform.OS): void => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
};

describe('notification sound settings navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNotificationChannelInitializationForTests();
    setNotificationChannelCreatorForTests(mockCreateChannel);
    setPlatform('android');
  });

  it('initializes notification channels before opening active channel settings', async () => {
    mockSendIntent.mockResolvedValueOnce();

    await expect(openActiveReminderNotificationSettings()).resolves.toEqual({
      destination: 'channel',
      opened: true,
    });

    expect(mockCreateChannel).toHaveBeenCalled();
    expect(mockCreateChannel.mock.invocationCallOrder[0]).toBeLessThan(
      mockSendIntent.mock.invocationCallOrder[0],
    );
  });

  it('attempts the specific active reminder channel settings first', async () => {
    mockSendIntent.mockResolvedValueOnce();

    await openActiveReminderNotificationSettings();

    expect(mockSendIntent).toHaveBeenCalledWith('android.settings.CHANNEL_NOTIFICATION_SETTINGS', [
      {
        key: 'android.provider.extra.APP_PACKAGE',
        value: 'com.shahab.waterreminder',
      },
      {
        key: 'android.provider.extra.CHANNEL_ID',
        value: HYDRATION_ACTIVE_CHANNEL_ID,
      },
    ]);
  });

  it('falls back to app notification settings when channel settings cannot open', async () => {
    mockSendIntent.mockRejectedValueOnce(new Error('channel unavailable')).mockResolvedValueOnce();

    await expect(openActiveReminderNotificationSettings()).resolves.toEqual({
      destination: 'app_notifications',
      opened: true,
    });

    expect(mockSendIntent).toHaveBeenNthCalledWith(
      2,
      'android.settings.APP_NOTIFICATION_SETTINGS',
      [
        {
          key: 'android.provider.extra.APP_PACKAGE',
          value: 'com.shahab.waterreminder',
        },
      ],
    );
  });

  it('falls back to generic app settings when notification settings cannot open', async () => {
    mockSendIntent
      .mockRejectedValueOnce(new Error('channel unavailable'))
      .mockRejectedValueOnce(new Error('notification settings unavailable'));
    mockOpenSettings.mockResolvedValueOnce();

    await expect(openActiveReminderNotificationSettings()).resolves.toEqual({
      destination: 'app_settings',
      opened: true,
    });

    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('returns a failed result instead of throwing when every navigation path fails', async () => {
    mockSendIntent
      .mockRejectedValueOnce(new Error('channel unavailable'))
      .mockRejectedValueOnce(new Error('notification settings unavailable'));
    mockOpenSettings.mockRejectedValueOnce(new Error('settings unavailable'));

    await expect(openActiveReminderNotificationSettings()).resolves.toEqual({
      destination: 'failed',
      opened: false,
    });
  });

  it('does not attempt settings navigation on unsupported platforms', async () => {
    setPlatform('ios');

    await expect(openActiveReminderNotificationSettings()).resolves.toEqual({
      destination: 'unsupported',
      opened: false,
    });

    expect(mockCreateChannel).not.toHaveBeenCalled();
    expect(mockSendIntent).not.toHaveBeenCalled();
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });
});
