import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { healthDataService } from './health-data-service.android';

const mockReadRecords = jest.fn<
  (...args: unknown[]) => Promise<{
    records: unknown[];
    pageToken?: string;
  }>
>();
const mockInsertRecords = jest.fn<(...args: unknown[]) => Promise<string[]>>();
const mockInitialize = jest.fn<() => Promise<boolean>>();
const mockDeleteRecords = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.mock('react-native-health-connect', () => ({
  SdkAvailabilityStatus: { SDK_AVAILABLE: 3 },
  getSdkStatus: async () => 3,
  initialize: () => mockInitialize(),
  readRecords: (...args: unknown[]) => mockReadRecords(...args),
  insertRecords: (...args: unknown[]) => mockInsertRecords(...args),
  deleteRecordsByUuids: (...args: unknown[]) => mockDeleteRecords(...args),
}));

const hydrationRecord = (id: string, amount: number) => ({
  metadata: { id, clientRecordId: `widget_${id}` },
  startTime: '2026-10-07T08:00:00.000Z',
  endTime: '2026-10-07T08:01:00.000Z',
  volume: { inMilliliters: amount },
});

describe('Android hydration data correctness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitialize.mockResolvedValue(true);
  });

  it('removes hydration by both remote and stable client identities', async () => {
    mockDeleteRecords.mockResolvedValue();
    await healthDataService.deleteHydration(['remote'], ['local']);
    expect(mockDeleteRecords).toHaveBeenCalledWith('Hydration', ['remote'], ['local']);
  });

  it('passes the edit version to Health Connect for replacement of the existing drink', async () => {
    mockInsertRecords.mockResolvedValue(['remote']);
    await healthDataService.writeHydration([
      {
        amountMl: 500,
        clientRecordId: 'local',
        clientRecordVersion: 42,
        startTime: '2026-10-08T08:00:00.000Z',
        endTime: '2026-10-08T08:01:00.000Z',
      },
    ]);
    expect(mockInsertRecords).toHaveBeenCalledWith([
      expect.objectContaining({
        metadata: expect.objectContaining({ clientRecordId: 'local', clientRecordVersion: 42 }),
      }),
    ]);
  });

  it('reads every Health Connect page so older drinks are not silently omitted', async () => {
    mockReadRecords
      .mockResolvedValueOnce({ records: [hydrationRecord('one', 250)], pageToken: 'next' })
      .mockResolvedValueOnce({ records: [hydrationRecord('two', 350)] });

    const records = await healthDataService.readHydration({
      startTime: '2026-10-01T00:00:00.000Z',
      endTime: '2026-10-08T00:00:00.000Z',
    });
    expect(records.map((record) => record.amountMl)).toEqual([250, 350]);
    expect(mockReadRecords).toHaveBeenNthCalledWith(
      2,
      'Hydration',
      expect.objectContaining({ pageToken: 'next' }),
    );
  });

  it('keeps the widget entry identity and millilitres when exporting', async () => {
    mockInsertRecords.mockResolvedValue(['health-id']);
    await expect(
      healthDataService.writeHydration([
        {
          amountMl: 350,
          clientRecordId: 'widget_drink',
          startTime: '2026-10-07T08:00:00.000Z',
          endTime: '2026-10-07T08:01:00.000Z',
        },
      ]),
    ).resolves.toEqual({ recordIds: ['health-id'] });
    expect(mockInsertRecords).toHaveBeenCalledWith([
      expect.objectContaining({
        metadata: expect.objectContaining({ clientRecordId: 'widget_drink' }),
        volume: { unit: 'milliliters', value: 350 },
      }),
    ]);
  });

  it('reports a lost native connection instead of claiming an empty successful sync', async () => {
    mockInitialize.mockResolvedValue(false);
    await expect(healthDataService.readHydration({ startTime: '', endTime: '' })).rejects.toThrow(
      'not available',
    );
    await expect(healthDataService.writeHydration([])).rejects.toThrow('not available');
    expect(mockReadRecords).not.toHaveBeenCalled();
    expect(mockInsertRecords).not.toHaveBeenCalled();
  });
});
