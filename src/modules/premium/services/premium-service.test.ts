/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { store } from '@state/store/store';
import { catalogReceived } from '../state/premium-slice';
import type { PremiumAccess, PremiumCatalog } from '../types';
import {
  canUsePremiumFeature,
  changePremiumTheme,
  hasPremiumAccess,
  loadPremiumCatalog,
  purchasePremium,
  restorePremium,
} from './premium-service';

const mockGetCatalog = jest.fn<() => Promise<PremiumCatalog>>();
const mockPurchase = jest.fn<() => Promise<PremiumCatalog>>();
const mockRestore = jest.fn<() => Promise<PremiumCatalog>>();
const mockCachedAccess = jest.fn<() => Promise<PremiumAccess>>();

jest.mock('react-native', () => {
  const native = jest.requireActual<typeof import('react-native')>('react-native');
  Object.defineProperty(native.Platform, 'OS', { get: () => 'android' });
  native.NativeModules.WaterReminderPremium = {
    getCatalog: (...args: []) => mockGetCatalog(...args),
    purchase: (...args: []) => mockPurchase(...args),
    restore: (...args: []) => mockRestore(...args),
    getCachedAccess: (...args: []) => mockCachedAccess(...args),
  };
  return native;
});
jest.mock('@core/config/premium-config', () => ({
  premiumConfig: {
    playPublicKey: 'public-test-key',
    features: {
      widgets: { available: true },
      icons: { available: true },
      themes: { available: true },
      wearOs: { available: false },
    },
  },
}));
jest.mock('@platform/storage', () => ({
  getStorage: () => ({ getString: () => undefined, set: () => undefined }),
}));
jest.mock('@state/store/store', () => {
  const { configureStore } =
    jest.requireActual<typeof import('@reduxjs/toolkit')>('@reduxjs/toolkit');
  const { premiumReducer } =
    jest.requireActual<typeof import('../state/premium-slice')>('../state/premium-slice');
  return { store: configureStore({ reducer: { premium: premiumReducer } }) };
});

const free: PremiumCatalog = {
  access: { active: false, accessUntil: 0, productIds: [] },
  products: [],
  pending: false,
};
const paid = (): PremiumCatalog => ({
  ...free,
  access: { active: true, accessUntil: Date.now() + 60_000, productIds: ['plus'] },
});

beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(catalogReceived(free));
  mockCachedAccess.mockResolvedValue(free.access);
});

describe('premium access boundaries', () => {
  it('unlocks only after the native verifier returns paid access', async () => {
    expect(hasPremiumAccess()).toBe(false);
    mockPurchase.mockResolvedValue(paid());
    await purchasePremium('monthly');
    expect(canUsePremiumFeature('widgets')).toBe(true);
    expect(canUsePremiumFeature('themes')).toBe(true);
    expect(canUsePremiumFeature('wearOs')).toBe(false);
  });

  it('does not unlock on pending payment', async () => {
    mockPurchase.mockResolvedValue({ ...free, pending: true });
    await purchasePremium('yearly');
    expect(hasPremiumAccess()).toBe(false);
    expect(store.getState().premium.pending).toBe(true);
  });

  it('preserves existing membership when a canceled operation rejects', async () => {
    store.dispatch(catalogReceived(paid()));
    mockPurchase.mockRejectedValue({ code: 'USER_CANCELED' });
    await expect(purchasePremium('lifetime')).rejects.toEqual({ code: 'USER_CANCELED' });
    expect(hasPremiumAccess()).toBe(true);
  });

  it('keeps bounded cached access during an outage but removes stale catalog prices', async () => {
    mockGetCatalog.mockRejectedValue(new Error('offline'));
    mockCachedAccess.mockResolvedValue(paid().access);
    await loadPremiumCatalog();
    expect(hasPremiumAccess()).toBe(true);
    expect(store.getState().premium.status).toBe('unavailable');
    expect(store.getState().premium.products).toEqual([]);
  });

  it('denies expired cached access and premium preference mutations', () => {
    store.dispatch(
      catalogReceived({ ...free, access: { ...paid().access, accessUntil: Date.now() - 1 } }),
    );
    expect(hasPremiumAccess()).toBe(false);
    expect(() => changePremiumTheme('rose')).toThrow('Premium is required.');
    expect(() => changePremiumTheme('default')).not.toThrow();
  });

  it('revokes cached access when a successful ownership refresh finds no purchases', async () => {
    store.dispatch(catalogReceived(paid()));
    mockGetCatalog.mockResolvedValue(free);
    await loadPremiumCatalog();
    expect(hasPremiumAccess()).toBe(false);
  });

  it('restores purchased access using the native ownership verifier', async () => {
    mockGetCatalog.mockResolvedValue(free);
    mockRestore.mockResolvedValue(paid());
    await restorePremium();
    expect(mockRestore).toHaveBeenCalledTimes(1);
    expect(hasPremiumAccess()).toBe(true);
  });
});
