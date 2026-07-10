import { describe, expect, it } from '@jest/globals';

import type { HydrationEntry } from '../types';
import { calculateHydrationSummary, getSuccessMicrocopy } from './summary';

const createEntry = (amount: number): HydrationEntry => ({
  amount,
  createdAt: '2026-07-10T08:00:00.000Z',
  id: String(amount),
  source: 'quick_add',
  timestamp: '2026-07-10T08:00:00.000Z',
  updatedAt: '2026-07-10T08:00:00.000Z',
});

describe('hydration summary', () => {
  it('calculates total, remaining, and progress percent', () => {
    expect(calculateHydrationSummary([createEntry(250), createEntry(500)], 2000)).toEqual({
      entries: [createEntry(250), createEntry(500)],
      goalAmount: 2000,
      percent: 0.375,
      remainingAmount: 1250,
      totalAmount: 750,
    });
  });

  it('does not show negative remaining amount after goal completion', () => {
    expect(calculateHydrationSummary([createEntry(2200)], 2000).remainingAmount).toBe(0);
  });

  it('keeps routine and completion copy warm and brief', () => {
    expect(getSuccessMicrocopy({ entryCount: 1, goalReached: false })).toBe('First glass logged.');
    expect(getSuccessMicrocopy({ entryCount: 2, goalReached: true })).toBe(
      "Nice work. You've finished today's hydration.",
    );
  });
});
