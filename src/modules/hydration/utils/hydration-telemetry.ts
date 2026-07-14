import { trackEventSafely } from '@platform/telemetry';

import type { HydrationEntrySource } from '../types';

type TrackHydrationLogSuccessOptions = {
  goalAmount: number;
  nextTotal: number;
  previousTotal: number;
  source: HydrationEntrySource;
};

export const trackHydrationLogSuccess = ({
  goalAmount,
  nextTotal,
  previousTotal,
  source,
}: TrackHydrationLogSuccessOptions): void => {
  if (source === 'quick_add') {
    trackEventSafely('quick_add_used', { source: 'app' });
  }

  if (source === 'custom') {
    trackEventSafely('custom_amount_logged', { source: 'app' });
  }

  if (previousTotal < goalAmount && nextTotal >= goalAmount) {
    trackEventSafely('goal_completed', {
      source: source === 'widget' ? 'widget' : 'app',
    });
  }
};
