import { logger } from '@core/logger';
import { refreshNativeWidgets, writeNativeWidgetState } from '@platform/widgets';

import type { WidgetRefreshReason } from '../types';
import { buildHydrationWidgetState } from './widget-state-builder';

let refreshPromise: Promise<void> | undefined;

export const refreshHydrationWidgets = (reason: WidgetRefreshReason): Promise<void> => {
  if (refreshPromise !== undefined) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const state = await buildHydrationWidgetState();

      await writeNativeWidgetState(JSON.stringify(state));
      await refreshNativeWidgets();
      logger.info('Hydration widgets refreshed.', { reason });
    } catch (error) {
      logger.warn('Hydration widget refresh failed.', { error, reason });
    } finally {
      refreshPromise = undefined;
    }
  })();

  return refreshPromise;
};
