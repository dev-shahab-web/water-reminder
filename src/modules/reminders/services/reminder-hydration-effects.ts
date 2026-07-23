import { setHydrationLogReminderCleanup } from '@modules/hydration/services/hydration-log-service';

import { clearPendingSnoozeAfterHydrationPersistence } from './reminder-snooze-manager';

export const registerReminderHydrationEffects = (): void => {
  setHydrationLogReminderCleanup(async () => {
    await clearPendingSnoozeAfterHydrationPersistence();
  });
};
