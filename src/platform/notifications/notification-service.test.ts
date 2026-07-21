import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

import {
  REMINDER_ACTION_DISMISS,
  REMINDER_ACTION_DRINK,
  REMINDER_ACTION_SNOOZE,
  REMINDER_NOTIFICATION_CATEGORY,
} from './notification-actions';
import {
  ensureNotificationCategories,
  initializeNotificationInfrastructure,
  resetNotificationCategoryInitializationForTests,
} from './notification-service';
import {
  resetNotificationChannelInitializationForTests,
  setNotificationChannelCreatorForTests,
} from './notification-channels';

const mockSetNotificationCategoryAsync = jest.fn(
  async (_identifier: string, _actions: unknown[]) => ({
    actions: [],
    identifier: REMINDER_NOTIFICATION_CATEGORY,
  }),
);
const mockSetNotificationChannelAsync = jest.fn(
  async (_id: string, _configuration: unknown) => null,
);
const mockSetNotificationHandler = jest.fn((_handler: unknown) => undefined);

const setPlatform = (os: typeof Platform.OS): void => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
};

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    DEFAULT: 5,
    LOW: 4,
  },
  setNotificationCategoryAsync: (identifier: string, actions: unknown[]) =>
    mockSetNotificationCategoryAsync(identifier, actions),
  setNotificationChannelAsync: (id: string, configuration: unknown) =>
    mockSetNotificationChannelAsync(id, configuration),
  setNotificationHandler: (handler: unknown) => mockSetNotificationHandler(handler),
}));

describe('notification service infrastructure', () => {
  beforeEach(() => {
    mockSetNotificationCategoryAsync.mockClear();
    mockSetNotificationChannelAsync.mockClear();
    mockSetNotificationHandler.mockClear();
    resetNotificationCategoryInitializationForTests();
    resetNotificationChannelInitializationForTests();
    setNotificationChannelCreatorForTests(async ({ configuration, id }) => {
      await mockSetNotificationChannelAsync(id, configuration);
    });
    setPlatform('android');
  });

  it('registers the reminder category with stable Drink, Snooze, and Dismiss actions', async () => {
    await ensureNotificationCategories();

    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledTimes(1);
    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledWith(REMINDER_NOTIFICATION_CATEGORY, [
      {
        buttonTitle: 'Drink now',
        identifier: REMINDER_ACTION_DRINK,
        options: {
          opensAppToForeground: true,
        },
      },
      {
        buttonTitle: 'Snooze',
        identifier: REMINDER_ACTION_SNOOZE,
        options: {
          opensAppToForeground: true,
        },
      },
      {
        buttonTitle: 'Dismiss',
        identifier: REMINDER_ACTION_DISMISS,
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
    expect(mockSetNotificationCategoryAsync.mock.calls[0]?.[1]).toHaveLength(3);
  });

  it('registers notification categories idempotently', async () => {
    await ensureNotificationCategories();
    await ensureNotificationCategories();

    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledTimes(1);
  });

  it('does not register notification categories on web', async () => {
    setPlatform('web');

    await ensureNotificationCategories();

    expect(mockSetNotificationCategoryAsync).not.toHaveBeenCalled();
  });

  it('initializes foreground behavior, channels, and categories without permissions', async () => {
    await initializeNotificationInfrastructure();

    expect(mockSetNotificationHandler).toHaveBeenCalledTimes(1);
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(3);
    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledTimes(1);
  });

  it('handles category registration failures without throwing', async () => {
    mockSetNotificationCategoryAsync.mockRejectedValueOnce(new Error('category unavailable'));

    await expect(ensureNotificationCategories()).resolves.toBeUndefined();
  });
});
