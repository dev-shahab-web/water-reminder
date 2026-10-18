import { useEffect } from 'react';
import { AppState } from 'react-native';

import { refreshHydrationWidgets } from '@modules/widgets';
import { useAppDispatch, useAppSelector } from '@state/store/hooks';
import { loadPremiumCatalog, syncPremiumIcon } from '../services/premium-service';
import { accessExpired } from '../state/premium-slice';
import { refreshPremiumPromotions } from '../services/premium-promotions';

export function PremiumRuntime() {
  const dispatch = useAppDispatch();
  const access = useAppSelector((state) => state.premium.access);
  const pending = useAppSelector((state) => state.premium.pending);
  const status = useAppSelector((state) => state.premium.status);
  const dailyOffers = useAppSelector((state) => state.premium.preferences.dailyOffers);

  useEffect(() => {
    refreshPremiumPromotions();
  }, [access, pending, status, dailyOffers]);

  useEffect(() => {
    void loadPremiumCatalog();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadPremiumCatalog();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pending) return;
    // Pending approval can complete while the app remains in the foreground.
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void loadPremiumCatalog();
    }, 30_000);
    return () => clearInterval(timer);
  }, [pending]);

  useEffect(() => {
    // Do not reset a paid icon while the first ownership check is still loading.
    if (status === 'idle' || status === 'loading') return;
    void syncPremiumIcon().catch(() => undefined);
  }, [access, status]);

  useEffect(() => {
    void refreshHydrationWidgets('settings_changed');
    if (!access.active) return;
    const timer = setTimeout(
      () => dispatch(accessExpired()),
      Math.max(0, access.accessUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [access, dispatch]);

  return null;
}
