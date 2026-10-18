import { NativeModules, Platform } from 'react-native';

import {
  premiumConfig,
  type PremiumFeature,
  type PremiumPlanId,
} from '@core/config/premium-config';
import { store } from '@state/store/store';
import { isPremiumThemeId } from '@shared/theme/premium-themes';

import {
  catalogLoading,
  catalogReceived,
  catalogUnavailable,
  cachedAccessReceived,
  preferencesChanged,
} from '../state/premium-slice';
import type { PremiumAccess, PremiumCatalog, PremiumIconId, PremiumThemeId } from '../types';
import { persistPremiumPreferences } from '../storage/premium-preferences';

type PremiumNative = {
  getCatalog(config: string): Promise<PremiumCatalog>;
  purchase(plan: string): Promise<PremiumCatalog>;
  restore(): Promise<PremiumCatalog>;
  setAppIcon(icon: string): Promise<void>;
  getCachedAccess(): Promise<PremiumAccess>;
};

const native: PremiumNative | undefined =
  Platform.OS === 'android' ? NativeModules.WaterReminderPremium : undefined;

export const isBillingConfigured = () => Boolean(native && premiumConfig.playPublicKey.trim());
export const supportsAppIcons = () => Boolean(native);
export const syncPremiumIcon = async () => {
  if (!native) return;
  const state = store.getState().premium;
  await native.setAppIcon(hasPremiumAccess() ? state.preferences.icon : 'default');
};
export const hasPremiumAccess = () => {
  const { access } = store.getState().premium;
  return access.active && access.accessUntil > Date.now();
};
export const canUsePremiumFeature = (feature: PremiumFeature) =>
  premiumConfig.features[feature].available && hasPremiumAccess();

let loading: Promise<void> | undefined;
export const loadPremiumCatalog = (): Promise<void> => {
  if (loading) return loading;
  loading = (async () => {
    store.dispatch(catalogLoading());
    try {
      if (!isBillingConfigured() || !native) throw new Error('BILLING_UNAVAILABLE');
      const result = await native.getCatalog(JSON.stringify(premiumConfig));
      store.dispatch(catalogReceived(result));
    } catch {
      // Retain the last verified, bounded access during a temporary outage.
      if (native && isBillingConfigured()) {
        try {
          store.dispatch(cachedAccessReceived(await native.getCachedAccess()));
        } catch {
          /* Unavailable in an older development build. */
        }
      }
      store.dispatch(catalogUnavailable());
    }
  })().finally(() => {
    loading = undefined;
  });
  return loading;
};

export const purchasePremium = async (plan: PremiumPlanId) => {
  if (!native || !isBillingConfigured()) throw new Error('BILLING_UNAVAILABLE');
  try {
    const result = await native.purchase(plan);
    store.dispatch(catalogReceived(result));
    return result;
  } catch (error) {
    if ((error as { code?: string })?.code === 'OFFER_CHANGED') await loadPremiumCatalog();
    throw error;
  }
};

export const restorePremium = async () => {
  if (!native || !isBillingConfigured()) throw new Error('BILLING_UNAVAILABLE');
  await loadPremiumCatalog();
  const result = await native.restore();
  store.dispatch(catalogReceived(result));
  return result;
};

export const changePremiumIcon = async (icon: PremiumIconId) => {
  if (icon !== 'default' && !canUsePremiumFeature('icons')) throw new Error('Premium is required.');
  if (!native) throw new Error('App icons are available in the Android app.');
  await native.setAppIcon(icon);
  const preferences = { ...store.getState().premium.preferences, icon };
  persistPremiumPreferences(preferences);
  store.dispatch(preferencesChanged(preferences));
};

export const changePremiumTheme = (theme: PremiumThemeId) => {
  if (!isPremiumThemeId(theme)) throw new Error('Unknown theme.');
  if (theme !== 'default' && !canUsePremiumFeature('themes'))
    throw new Error('Premium is required.');
  const preferences = { ...store.getState().premium.preferences, theme };
  persistPremiumPreferences(preferences);
  store.dispatch(preferencesChanged(preferences));
};

export const billingErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code;
  if (code === 'OFFER_CHANGED')
    return 'Your Google Play offer has changed. Review the updated price and trial details, then continue when you are ready.';
  if (code === 'PURCHASE_PENDING')
    return 'Your payment is pending. Plus will unlock after Google Play confirms it.';
  if (code === 'ITEM_ALREADY_OWNED')
    return 'You already own this item. Tap Restore purchases to sync your access.';
  return 'Google Play could not complete this request. Please check your connection and try again. You have not been given a new plan.';
};
