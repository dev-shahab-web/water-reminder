import { logger } from '@core/logger';
import { refreshNativeWidgets, writeNativeWidgetState } from '@platform/widgets';

import type { WidgetRefreshReason } from '../types';
import { buildHydrationWidgetState } from './widget-state-builder';

let refreshQueue: Promise<void> = Promise.resolve();

export const refreshHydrationWidgets = (reason: WidgetRefreshReason): Promise<void> => {
  const runRefresh = async () => {
    try {
      const state = await buildHydrationWidgetState();

      await writeNativeWidgetState(JSON.stringify(state));
      await refreshNativeWidgets();
      logger.info('Hydration widgets refreshed.', {
        consumedMl: state.consumedMl,
        reason,
        updatedAt: state.updatedAt,
      });
    } catch (error) {
      logger.warn('Hydration widget refresh failed.', { error, reason });
    }
  };

  refreshQueue = refreshQueue.then(runRefresh, runRefresh);

  return refreshQueue;
};
