import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { store } from '@state/store/store';
import { hasPremiumAccess } from '../services/premium-service';

// The clock is an external source: update at expiry and on foreground, including
// when Android suspended a timer. Rendering never samples time directly.
const subscribe = (onChange: () => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    if (timer) clearTimeout(timer);
    onChange();
    const { access } = store.getState().premium;
    const remaining = access.accessUntil - Date.now();
    if (access.active && remaining > 0)
      timer = setTimeout(refresh, Math.min(remaining, 2_147_483_647));
  };
  const unsubscribe = store.subscribe(refresh);
  const listener = AppState.addEventListener('change', (state) => {
    if (state === 'active') refresh();
  });
  refresh();
  return () => {
    unsubscribe();
    listener.remove();
    if (timer) clearTimeout(timer);
  };
};

export const usePremiumAccess = () =>
  useSyncExternalStore(subscribe, hasPremiumAccess, () => false);
