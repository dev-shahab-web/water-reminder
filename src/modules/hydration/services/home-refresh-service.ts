import { syncHealthConnectIfConnected } from '@modules/health-connect/services/health-connect-sync-service';
import { refreshHydrationWidgets } from '@modules/widgets';
import { awaitDatabaseReady } from '@platform/database';

import { getTodayHydrationEntries } from '../repository/hydration-repository';
import type { HydrationEntry } from '../types';

export type HomeHydrationRefreshResult = {
  entries: HydrationEntry[];
  healthSyncFailed: boolean;
};

export const refreshHomeHydrationFromCanonicalSource =
  async (): Promise<HomeHydrationRefreshResult> => {
    await awaitDatabaseReady();
    await getTodayHydrationEntries();

    let healthSyncFailed = false;

    try {
      await syncHealthConnectIfConnected();
    } catch {
      healthSyncFailed = true;
    }

    const entries = await getTodayHydrationEntries();
    await refreshHydrationWidgets('health_connect_sync');

    return {
      entries,
      healthSyncFailed,
    };
  };
