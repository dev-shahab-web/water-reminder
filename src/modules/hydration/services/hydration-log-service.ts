import { queueBestEffortHealthConnectSync } from '@modules/health-connect/services/health-connect-sync-service';
import { clearPendingSnoozeAfterHydrationPersistence } from '@modules/reminders/services/reminder-snooze-manager';
import { refreshHydrationWidgets } from '@modules/widgets';
import { trackEventSafely } from '@platform/telemetry';

import { addHydrationEntry } from '../repository/hydration-repository';
import type { HydrationEntry, HydrationEntrySource } from '../types';

export const persistHydrationLog = async ({
  amount,
  source,
}: {
  amount: number;
  source: HydrationEntrySource;
}): Promise<HydrationEntry> => {
  const entry = await addHydrationEntry({ amount, source });

  await clearPendingSnoozeAfterHydrationPersistence();
  void refreshHydrationWidgets('hydration_changed');
  void queueBestEffortHealthConnectSync();
  trackEventSafely('hydration_log_action', { source: source === 'widget' ? 'widget' : 'app' });

  return entry;
};
