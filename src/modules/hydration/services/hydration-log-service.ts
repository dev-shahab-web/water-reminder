import { queueBestEffortHealthConnectSync } from '@modules/health-connect/services/health-connect-sync-service';
import { refreshHydrationWidgets } from '@modules/widgets';
import { trackEventSafely } from '@platform/telemetry';

import { addHydrationEntry } from '../repository/hydration-repository';
import type { HydrationEntry, HydrationEntrySource } from '../types';

type HydrationLogReminderCleanup = () => Promise<void>;

let reminderCleanupAfterHydrationPersistence: HydrationLogReminderCleanup = async () => undefined;

export const setHydrationLogReminderCleanup = (cleanup: HydrationLogReminderCleanup): void => {
  reminderCleanupAfterHydrationPersistence = cleanup;
};

export const persistHydrationLog = async ({
  amount,
  source,
}: {
  amount: number;
  source: HydrationEntrySource;
}): Promise<HydrationEntry> => {
  const entry = await addHydrationEntry({ amount, source });

  await reminderCleanupAfterHydrationPersistence();
  // Do not report the app write as complete while the widget still projects
  // the previous database total. The coordinator absorbs widget-only failures,
  // so local hydration persistence remains the source of truth.
  await refreshHydrationWidgets('hydration_changed');
  void queueBestEffortHealthConnectSync();
  trackEventSafely('hydration_log_action', { source: source === 'widget' ? 'widget' : 'app' });

  return entry;
};
