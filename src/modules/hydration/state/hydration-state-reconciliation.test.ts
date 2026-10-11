import { describe, expect, it } from '@jest/globals';

import type { HydrationEntry } from '../types';
import { reconcileLoggedEntry, shouldApplyHydrationRead } from './hydration-state-reconciliation';

const createEntry = (id: string, amount: number, timestamp: string): HydrationEntry => ({
  amount,
  createdAt: timestamp,
  id,
  source: 'quick_add',
  timestamp,
  updatedAt: timestamp,
});

describe('hydration state reconciliation', () => {
  it('accepts only the most recently requested database read', () => {
    expect(shouldApplyHydrationRead('newer-read', 'newer-read')).toBe(true);
    expect(shouldApplyHydrationRead('newer-read', 'older-read')).toBe(false);
    expect(shouldApplyHydrationRead(undefined, 'older-read')).toBe(false);
  });

  it('upserts an entry already observed by a concurrent widget reload', () => {
    const existing = createEntry('shared-entry', 250, '2026-10-08T08:00:00.000Z');
    const other = createEntry('other-entry', 500, '2026-10-08T07:00:00.000Z');

    const result = reconcileLoggedEntry([existing, other], existing);

    expect(result.entries).toEqual([existing, other]);
    expect(result.previousTotal).toBe(500);
  });

  it('adds a new log once and preserves newest-first ordering', () => {
    const earlier = createEntry('earlier', 250, '2026-10-08T07:00:00.000Z');
    const latest = createEntry('latest', 500, '2026-10-08T08:00:00.000Z');

    const result = reconcileLoggedEntry([earlier], latest);

    expect(result.entries).toEqual([latest, earlier]);
    expect(result.previousTotal).toBe(250);
  });
});
