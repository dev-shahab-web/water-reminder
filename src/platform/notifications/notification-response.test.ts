import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type * as Notifications from 'expo-notifications';
import { addNotificationResponseListener } from './notification-service';
import { PREMIUM_NOTIFICATION_SOURCE } from './premium-notification';

let mockReceive: (response: Notifications.NotificationResponse) => void;
let mockLast: Notifications.NotificationResponse | null;
const mockClear = jest.fn(async () => {
  mockLast = null;
});
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: (receive: typeof mockReceive) => {
    mockReceive = receive;
    return { remove: jest.fn() };
  },
  getLastNotificationResponseAsync: async () => mockLast,
  clearLastNotificationResponseAsync: () => mockClear(),
}));

const response = (date: number, source = PREMIUM_NOTIFICATION_SOURCE) =>
  ({
    actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
    notification: {
      date,
      request: {
        identifier: 'daily-plus',
        trigger: null,
        content: {
          title: 'Plus',
          subtitle: null,
          body: 'Explore Plus',
          sound: null,
          categoryIdentifier: null,
          data: { source },
        },
      },
    },
  }) as Notifications.NotificationResponse;
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLast = null;
});

describe('Plus notification response routing', () => {
  it('replays a cold-start tap once even when also delivered by the live listener', async () => {
    mockLast = response(1000);
    const listener = jest.fn(async () => undefined);
    const subscription = addNotificationResponseListener(listener);
    mockReceive(mockLast);
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ data: { source: PREMIUM_NOTIFICATION_SOURCE } }),
    );
    expect(mockClear).toHaveBeenCalledTimes(1);
    subscription.remove();
  });

  it('accepts tomorrow’s tap for the same repeating notification identifier', async () => {
    const listener = jest.fn(async () => undefined);
    const subscription = addNotificationResponseListener(listener);
    mockReceive(response(1000));
    await flush();
    mockReceive(response(1000 + 86_400_000));
    await flush();
    expect(listener).toHaveBeenCalledTimes(2);
    subscription.remove();
  });

  it('continues forwarding hydration taps and ignores unrelated sources', async () => {
    const listener = jest.fn(async () => undefined);
    const subscription = addNotificationResponseListener(listener);
    mockReceive(response(1000, 'hydration-reminder'));
    mockReceive(response(2000, 'unrelated'));
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    subscription.remove();
  });
});
