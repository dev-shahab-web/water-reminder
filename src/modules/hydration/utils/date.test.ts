import { describe, expect, it } from '@jest/globals';

import {
  addLocalDays,
  formatHistoryDate,
  getDateFromLocalDateKey,
  getLocalDateKey,
  getLocalDayBounds,
} from './date';

describe('hydration date utilities', () => {
  it('derives stable local date keys from dates', () => {
    expect(getLocalDateKey(new Date(2026, 6, 11, 23, 59))).toBe('2026-07-11');
  });

  it('builds local day bounds around midnight', () => {
    const bounds = getLocalDayBounds(new Date(2026, 6, 11, 23, 59));
    const start = new Date(bounds.startIso);
    const end = new Date(bounds.endIso);

    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getDate()).toBe(addLocalDays(start, 1).getDate());
  });

  it('round-trips local date keys and formats history dates', () => {
    const date = getDateFromLocalDateKey('2026-07-11');

    expect(getLocalDateKey(date)).toBe('2026-07-11');
    expect(formatHistoryDate(date).length).toBeGreaterThan(0);
  });
});
