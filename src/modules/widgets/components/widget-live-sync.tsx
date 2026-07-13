import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { subscribeToNativeWidgetHydrationChanges } from '@platform/widgets';
import { useAppDispatch } from '@state/store/hooks';

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
      syncQueue.current = syncQueue.current.then(
        () => syncWidgetLiveState({ dispatch, reason }),
        () => syncWidgetLiveState({ dispatch, reason }),
      );

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

    return () => {
      appStateSubscription.remove();
      unsubscribeWidgetChanges();
    };
  }, [dispatch]);

  return null;
}
