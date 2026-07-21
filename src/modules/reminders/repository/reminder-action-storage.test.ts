import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  hasHandledReminderOccurrence,
  markReminderOccurrenceHandled,
  reminderActionStorageKeys,
} from './reminder-action-storage';

const mockStorageValues = new Map<string, boolean | number | string>();

jest.mock('@platform/storage', () => ({
  getStorage: () => ({
    getString: (key: string) => {
      const value = mockStorageValues.get(key);

      return typeof value === 'string' ? value : undefined;
    },
    set: (key: string, value: boolean | number | string) => {
      mockStorageValues.set(key, value);
    },
  }),
}));

describe('reminder action storage', () => {
  beforeEach(() => {
    mockStorageValues.clear();
  });

  it('marks reminder occurrences exactly once', () => {
    expect(markReminderOccurrenceHandled('occurrence-1')).toBe(true);
    expect(markReminderOccurrenceHandled('occurrence-1')).toBe(false);
    expect(hasHandledReminderOccurrence('occurrence-1')).toBe(true);
  });

  it('recovers safely from malformed stored data', () => {
    mockStorageValues.set(reminderActionStorageKeys.handledOccurrenceIds, 'not-json');

    expect(hasHandledReminderOccurrence('occurrence-1')).toBe(false);
    expect(markReminderOccurrenceHandled('occurrence-1')).toBe(true);
  });
});
