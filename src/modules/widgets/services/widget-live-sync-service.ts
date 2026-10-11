import { loadTodayHydration } from '@modules/hydration';
import { trackEventSafely } from '@platform/telemetry';
import type { AppDispatch } from '@state/store';
import { queueBestEffortHealthConnectSync } from '@modules/health-connect/services/health-connect-sync-service';

import { refreshHydrationWidgets } from './widget-refresh-coordinator';

export type WidgetLiveSyncReason = 'app_active' | 'native_widget_event';

export const syncWidgetLiveState = async ({
  dispatch,
  reason,
}: {
  dispatch: AppDispatch;
  reason: WidgetLiveSyncReason;
}): Promise<void> => {
  // SQLite sees committed widget writes on the next query. Closing the shared
  // connection here races with queries triggered by notification/app activation.
  await dispatch(loadTodayHydration()).unwrap();
  await refreshHydrationWidgets(reason === 'app_active' ? 'app_active' : 'widget_event');

  // Keep local feedback immediate; Health Connect is optional and may be slow.
  void queueBestEffortHealthConnectSync().then(() => dispatch(loadTodayHydration()));

  if (reason === 'native_widget_event') {
    trackEventSafely('widget_action_used', { source: 'widget' });
  }
};
