import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { HydrationEntry } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports */

const mockAddHydrationEntry = jest.fn<() => Promise<HydrationEntry>>();
const mockReminderCleanupAfterHydrationPersistence = jest.fn(async () => undefined);
const mockRefreshHydrationWidgets = jest.fn(async (_reason: string) => undefined);
const mockQueueBestEffortHealthConnectSync = jest.fn(() => undefined);
const mockTrackEventSafely = jest.fn(() => undefined);

jest.mock('../repository/hydration-repository', () => ({
  addHydrationEntry: mockAddHydrationEntry,
}));

jest.mock('@modules/widgets', () => ({
  refreshHydrationWidgets: mockRefreshHydrationWidgets,
}));

jest.mock('@modules/health-connect/services/health-connect-sync-service', () => ({
  queueBestEffortHealthConnectSync: mockQueueBestEffortHealthConnectSync,
}));

jest.mock('@platform/telemetry', () => ({
  trackEventSafely: mockTrackEventSafely,
}));

const { persistHydrationLog, setHydrationLogReminderCleanup } =
  require('./hydration-log-service') as typeof import('./hydration-log-service');

const entry: HydrationEntry = {
  amount: 250,
  createdAt: '2026-07-21T10:00:00.000Z',
  id: 'entry-1',
  source: 'quick_add',
  timestamp: '2026-07-21T10:00:00.000Z',
  updatedAt: '2026-07-21T10:00:00.000Z',
};

describe('hydration log service reminder effects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHydrationLogReminderCleanup(mockReminderCleanupAfterHydrationPersistence);
  });

  it('clears pending snooze only after hydration is persisted', async () => {
    mockAddHydrationEntry.mockResolvedValue(entry);

    await expect(persistHydrationLog({ amount: 250, source: 'quick_add' })).resolves.toBe(entry);

    expect(mockAddHydrationEntry).toHaveBeenCalledWith({
      amount: 250,
      source: 'quick_add',
    });
    expect(mockReminderCleanupAfterHydrationPersistence).toHaveBeenCalledTimes(1);
    expect(mockRefreshHydrationWidgets).toHaveBeenCalledWith('hydration_changed');
  });

  it('does not clear pending snooze when hydration persistence fails', async () => {
    mockAddHydrationEntry.mockRejectedValue(new Error('SQLite unavailable.'));

    await expect(persistHydrationLog({ amount: 250, source: 'quick_add' })).rejects.toThrow(
      'SQLite unavailable.',
    );

    expect(mockReminderCleanupAfterHydrationPersistence).not.toHaveBeenCalled();
  });
});
