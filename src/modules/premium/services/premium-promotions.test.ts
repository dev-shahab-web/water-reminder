/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';
import { premiumConfig } from '@core/config/premium-config';
import {
  PREMIUM_NOTIFICATION_ID,
  PREMIUM_NOTIFICATION_SOURCE,
} from '@platform/notifications/premium-notification';
import type { PremiumCatalog } from '../types';
import { syncPremiumPromotions } from './premium-promotions';

type Request = {
  identifier: string;
  content: { data?: Record<string, unknown> };
  trigger?: unknown;
};
let mockScheduled: Request[];
let mockGranted: boolean;
let mockOnboarded: boolean;
let mockPremium: PremiumCatalog & { status: string; preferences: { dailyOffers: boolean } };
const mockSchedule = jest.fn(async (request: Request) => {
  mockScheduled.push(request);
  return request.identifier;
});
const mockCancel = jest.fn(async (id: string) => {
  mockScheduled = mockScheduled.filter((item) => item.identifier !== id);
});
const mockDismiss = jest.fn(async (_id: string) => undefined);
const mockPermissions = jest.fn(async () => ({ granted: mockGranted }));
const mockChannel = jest.fn(async (..._args: unknown[]) => null);
const mockHydration: Request = {
  identifier: 'hydration-1',
  content: { data: { source: 'scheduled', type: 'hydration_reminder' } },
};
const mockPromo: Request = {
  identifier: PREMIUM_NOTIFICATION_ID,
  content: { data: { source: PREMIUM_NOTIFICATION_SOURCE } },
};

jest.mock('expo-notifications', () => ({
  AndroidImportance: { LOW: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  getAllScheduledNotificationsAsync: async () => [...mockScheduled],
  getPermissionsAsync: () => mockPermissions(),
  getPresentedNotificationsAsync: async () => [{ request: mockHydration }, { request: mockPromo }],
  cancelScheduledNotificationAsync: (id: string) => mockCancel(id),
  dismissNotificationAsync: (id: string) => mockDismiss(id),
  setNotificationChannelAsync: (...args: unknown[]) => mockChannel(...args),
  scheduleNotificationAsync: (request: Request) => mockSchedule(request),
}));
jest.mock('@modules/onboarding/repository/onboarding-storage', () => ({
  getOnboardingState: () => ({ onboardingCompleted: mockOnboarded }),
}));
jest.mock('@state/store/store', () => ({
  store: { getState: () => ({ premium: mockPremium }), dispatch: jest.fn() },
}));
jest.mock('@platform/storage', () => ({
  getStorage: () => ({ getString: () => undefined, getBoolean: () => undefined, set: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  mockGranted = true;
  mockOnboarded = true;
  mockScheduled = [mockHydration];
  mockPremium = {
    status: 'ready',
    pending: false,
    preferences: { dailyOffers: true },
    access: { active: false, accessUntil: 0, productIds: [] },
    products: [
      { id: 'monthly', productId: 'plus', price: 1.99, formattedPrice: '$1.99', currency: 'USD' },
    ],
  };
});

describe('daily Plus reminders', () => {
  it('keeps one silent daily schedule across repeated refreshes without touching hydration', async () => {
    await syncPremiumPromotions();
    await syncPremiumPromotions();
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: PREMIUM_NOTIFICATION_ID,
        content: expect.objectContaining({
          sound: false,
          body: premiumConfig.promotions.dailyReminder.body,
        }),
        trigger: expect.objectContaining({ type: 'daily', hour: 18, minute: 0 }),
      }),
    );
    expect(mockScheduled.map((item) => item.identifier)).toEqual([
      'hydration-1',
      PREMIUM_NOTIFICATION_ID,
    ]);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it.each([
    'paid',
    'pending',
    'unavailable',
    'opt-out',
    'permission-denied',
    'onboarding',
    'no-products',
  ])('removes only Plus schedules and visible notifications when %s', async (reason) => {
    mockScheduled.push(mockPromo);
    if (reason === 'paid') mockPremium.access.active = true;
    if (reason === 'pending') mockPremium.pending = true;
    if (reason === 'unavailable') mockPremium.status = 'unavailable';
    if (reason === 'opt-out') mockPremium.preferences.dailyOffers = false;
    if (reason === 'permission-denied') mockGranted = false;
    if (reason === 'onboarding') mockOnboarded = false;
    if (reason === 'no-products') mockPremium.products = [];
    await syncPremiumPromotions();
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(mockScheduled).toEqual([mockHydration]);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledWith(PREMIUM_NOTIFICATION_ID);
  });

  it('rechecks access after an asynchronous permission lookup', async () => {
    mockPermissions.mockImplementationOnce(async () => {
      mockPremium.access.active = true;
      return { granted: true };
    });
    await syncPremiumPromotions();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('does not replace alarms while a transient billing refresh is loading', async () => {
    await syncPremiumPromotions();
    mockPremium.status = 'loading';
    await syncPremiumPromotions();
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockCancel).not.toHaveBeenCalled();
    mockPremium.preferences.dailyOffers = false;
    await syncPremiumPromotions();
    expect(mockCancel).toHaveBeenCalledWith(PREMIUM_NOTIFICATION_ID);
  });

  it('lets a queued opt-out cancel an in-flight schedule', async () => {
    mockSchedule.mockImplementationOnce(async (request) => {
      mockScheduled.push(request);
      mockPremium.preferences.dailyOffers = false;
      return request.identifier;
    });
    await Promise.all([syncPremiumPromotions(), syncPremiumPromotions()]);
    expect(mockScheduled).toEqual([mockHydration]);
  });
});
