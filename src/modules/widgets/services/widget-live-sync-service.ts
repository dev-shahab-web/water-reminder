import { loadTodayHydration } from '@modules/hydration';
import { resetDatabaseConnection } from '@platform/database';
import type { AppDispatch } from '@state/store';

import { refreshHydrationWidgets } from './widget-refresh-coordinator';

export type WidgetLiveSyncReason = 'app_active' | 'native_widget_event';

export const syncWidgetLiveState = async ({
  dispatch,
  reason,
}: {
  dispatch: AppDispatch;
  reason: WidgetLiveSyncReason;
}): Promise<void> => {
  await resetDatabaseConnection();
  await dispatch(loadTodayHydration()).unwrap();
  await refreshHydrationWidgets(reason === 'app_active' ? 'app_active' : 'widget_event');
};
