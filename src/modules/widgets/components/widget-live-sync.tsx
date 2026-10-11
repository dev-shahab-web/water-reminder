import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { subscribeToNativeWidgetHydrationChanges } from '@platform/widgets';
import { useAppDispatch } from '@state/store/hooks';
import { logger } from '@core/logger';
import { subscribeToQuickAddPresets } from '@modules/hydration/storage/quick-add-presets-storage';
import { refreshHydrationWidgets } from '../services/widget-refresh-coordinator';
import { loadTodayHydration } from '@modules/hydration';
import { subscribeToHealthConnectHydrationChanges } from '@modules/health-connect/services/health-connect-sync-service';

import {
  syncWidgetLiveState,
  type WidgetLiveSyncReason,
} from '../services/widget-live-sync-service';

export function WidgetLiveSync() {
  const dispatch = useAppDispatch();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const syncFromCanonicalStorage = (reason: WidgetLiveSyncReason) => {
      syncQueue.current = syncQueue.current
        .then(() => syncWidgetLiveState({ dispatch, reason }))
        .catch((error: unknown) => {
          logger.warn('Widget reconciliation failed; will retry on next activation.', { error });
        });

      return syncQueue.current;
    };

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      const wasInactive = appState.current === 'inactive' || appState.current === 'background';
      appState.current = nextState;

      if (wasInactive && nextState === 'active') {
        void syncFromCanonicalStorage('app_active');
      }
    });
    const unsubscribeWidgetChanges = subscribeToNativeWidgetHydrationChanges(() => {
      void syncFromCanonicalStorage('native_widget_event');
    });
    const unsubscribePresets = subscribeToQuickAddPresets(() => {
      void refreshHydrationWidgets('settings_changed');
    });
    const unsubscribeHealthChanges = subscribeToHealthConnectHydrationChanges(() => {
      void dispatch(loadTodayHydration());
    });
    // Also reconcile writes made while the React Native process was stopped.
    void syncFromCanonicalStorage('app_active');

    return () => {
      appStateSubscription.remove();
      unsubscribeWidgetChanges();
      unsubscribePresets();
      unsubscribeHealthChanges();
    };
  }, [dispatch]);

  return null;
}
