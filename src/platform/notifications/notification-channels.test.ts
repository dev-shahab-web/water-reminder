import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

import {
  HYDRATION_ACTIVE_CHANNEL_ID,
  HYDRATION_GENTLE_CHANNEL_ID,
  HYDRATION_SNOOZE_CHANNEL_ID,
  ensureNotificationChannels,
  hydrationReminderChannelDefinitions,
  hydrationReminderChannelIds,
  resetNotificationChannelInitializationForTests,
  setNotificationChannelCreatorForTests,
} from './notification-channels';

const mockSetNotificationChannelAsync = jest.fn(
  async (_id: string, _configuration: unknown) => null,
);

const setPlatform = (os: typeof Platform.OS): void => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
};

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    DEFAULT: 5,
    HIGH: 6,
    LOW: 4,
  },
  setNotificationChannelAsync: (id: string, configuration: unknown) =>
    mockSetNotificationChannelAsync(id, configuration),
}));

describe('notification channels', () => {
  beforeEach(() => {
    mockSetNotificationChannelAsync.mockClear();
    resetNotificationChannelInitializationForTests();
    setNotificationChannelCreatorForTests(async ({ configuration, id }) => {
      await mockSetNotificationChannelAsync(id, configuration);
    });
    setPlatform('android');
  });

  it('defines exactly the approved hydration channel identifiers', () => {
    expect(hydrationReminderChannelIds).toEqual([
      'hydration-gentle-v1',
      'hydration-active-v1',
      'hydration-snooze-v1',
    ]);
    expect(new Set(hydrationReminderChannelIds).size).toBe(3);
  });

  it('configures Gentle as silent with vibration disabled', () => {
    const gentle = hydrationReminderChannelDefinitions.find(
      (definition) => definition.id === HYDRATION_GENTLE_CHANNEL_ID,
    );

    expect(gentle?.configuration).toMatchObject({
      enableVibrate: false,
      importance: 4,
      sound: null,
    });
  });

  it('configures Active with default sound and vibration', () => {
    const active = hydrationReminderChannelDefinitions.find(
      (definition) => definition.id === HYDRATION_ACTIVE_CHANNEL_ID,
    );

    expect(active?.configuration).toMatchObject({
      enableVibrate: true,
      importance: 5,
      sound: 'default',
    });
  });

  it('configures Snooze with a quiet fixed behavior', () => {
    const snooze = hydrationReminderChannelDefinitions.find(
      (definition) => definition.id === HYDRATION_SNOOZE_CHANNEL_ID,
    );

    expect(snooze?.configuration).toMatchObject({
      enableVibrate: false,
      importance: 4,
      sound: null,
    });
  });

  it('creates the approved Android channels once through the platform abstraction', async () => {
    await ensureNotificationChannels();
    await ensureNotificationChannels();

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(3);
    expect(mockSetNotificationChannelAsync.mock.calls.map((call) => call[0])).toEqual([
      HYDRATION_GENTLE_CHANNEL_ID,
      HYDRATION_ACTIVE_CHANNEL_ID,
      HYDRATION_SNOOZE_CHANNEL_ID,
    ]);
  });

  it('is safe on non-Android platforms', async () => {
    setPlatform('web');

    await ensureNotificationChannels();

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('handles channel initialization failures without throwing', async () => {
    mockSetNotificationChannelAsync.mockRejectedValueOnce(new Error('native unavailable'));

    await expect(ensureNotificationChannels()).resolves.toBeUndefined();
  });
});
