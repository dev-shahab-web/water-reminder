import { getDatabase } from '@platform/database';

import { getLocalDayBounds } from '../utils/date';
import type { HydrationEntry, HydrationEntrySource } from '../types';

type HydrationEntryRow = {
  amount: number;
  createdAt: string;
  healthConnectClientRecordId: string | null;
  healthConnectDataOrigin: string | null;
  healthConnectRecordId: string | null;
  healthConnectSyncedAt: string | null;
  id: string;
  source: HydrationEntrySource;
  timestamp: string;
  updatedAt: string;
};

type AddHydrationEntryInput = {
  amount: number;
  healthConnectClientRecordId?: string;
  healthConnectDataOrigin?: string;
  healthConnectRecordId?: string;
  healthConnectSyncedAt?: string;
  id?: string;
  source: HydrationEntrySource;
  timestamp?: string;
};

const createId = (): string => {
  return `hydration_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const mapRowToEntry = (row: HydrationEntryRow): HydrationEntry => ({
  amount: row.amount,
  createdAt: row.createdAt,
  healthConnectClientRecordId: row.healthConnectClientRecordId ?? undefined,
  healthConnectDataOrigin: row.healthConnectDataOrigin ?? undefined,
  healthConnectRecordId: row.healthConnectRecordId ?? undefined,
  healthConnectSyncedAt: row.healthConnectSyncedAt ?? undefined,
  id: row.id,
  source: row.source,
  timestamp: row.timestamp,
  updatedAt: row.updatedAt,
});

export const getTodayHydrationEntries = async (date = new Date()): Promise<HydrationEntry[]> => {
  const database = await getDatabase();
  const bounds = getLocalDayBounds(date);
  const rows = await database.getAllAsync<HydrationEntryRow>(
    `
      SELECT id, timestamp, amount, source, createdAt, updatedAt
        , healthConnectRecordId, healthConnectClientRecordId, healthConnectDataOrigin, healthConnectSyncedAt
      FROM hydration_entries
      WHERE timestamp >= ? AND timestamp < ?
      ORDER BY timestamp DESC;
    `,
    [bounds.startIso, bounds.endIso],
  );

  return rows.map(mapRowToEntry);
};

export const getHydrationEntriesForDate = async (date: Date): Promise<HydrationEntry[]> => {
  return getTodayHydrationEntries(date);
};

export const hasAnyHydrationEntries = async (): Promise<boolean> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ entryCount: number }>(
    `
      SELECT COUNT(*) AS entryCount
      FROM hydration_entries;
    `,
    [],
  );

  return (row?.entryCount ?? 0) > 0;
};

export const getHydrationEntryCount = async (): Promise<number> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ entryCount: number }>(
    `
      SELECT COUNT(*) AS entryCount
      FROM hydration_entries;
    `,
    [],
  );

  return row?.entryCount ?? 0;
};

export const getHydrationDatabaseSizeBytes = async (): Promise<number> => {
  const database = await getDatabase();
  const pageCount = await database.getFirstAsync<{ page_count: number }>('PRAGMA page_count;', []);
  const pageSize = await database.getFirstAsync<{ page_size: number }>('PRAGMA page_size;', []);

  return (pageCount?.page_count ?? 0) * (pageSize?.page_size ?? 0);
};

export const getAllHydrationEntries = async (): Promise<HydrationEntry[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<HydrationEntryRow>(
    `
      SELECT id, timestamp, amount, source, createdAt, updatedAt
        , healthConnectRecordId, healthConnectClientRecordId, healthConnectDataOrigin, healthConnectSyncedAt
      FROM hydration_entries
      ORDER BY timestamp DESC;
    `,
    [],
  );

  return rows.map(mapRowToEntry);
};

export const addHydrationEntry = async ({
  amount,
  healthConnectClientRecordId,
  healthConnectDataOrigin,
  healthConnectRecordId,
  healthConnectSyncedAt,
  id,
  source,
  timestamp = new Date().toISOString(),
}: AddHydrationEntryInput): Promise<HydrationEntry> => {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const entry: HydrationEntry = {
    amount,
    createdAt: now,
    healthConnectClientRecordId,
    healthConnectDataOrigin,
    healthConnectRecordId,
    healthConnectSyncedAt,
    id: id ?? createId(),
    source,
    timestamp,
    updatedAt: now,
  };

  await database.runAsync(
    `
      INSERT INTO hydration_entries (
        id,
        timestamp,
        amount,
        source,
        createdAt,
        updatedAt,
        healthConnectRecordId,
        healthConnectClientRecordId,
        healthConnectDataOrigin,
        healthConnectSyncedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      entry.id,
      entry.timestamp,
      entry.amount,
      entry.source,
      entry.createdAt,
      entry.updatedAt,
      entry.healthConnectRecordId ?? null,
      entry.healthConnectClientRecordId ?? null,
      entry.healthConnectDataOrigin ?? null,
      entry.healthConnectSyncedAt ?? null,
    ],
  );

  return entry;
};

export const updateHydrationEntry = async ({
  amount,
  id,
}: {
  amount: number;
  id: string;
}): Promise<HydrationEntry | null> => {
  const database = await getDatabase();
  const updatedAt = new Date().toISOString();

  await database.runAsync(
    `
      UPDATE hydration_entries
      SET amount = ?, source = 'edit', updatedAt = ?
      WHERE id = ?;
    `,
    [amount, updatedAt, id],
  );

  const row = await database.getFirstAsync<HydrationEntryRow>(
    `
      SELECT id, timestamp, amount, source, createdAt, updatedAt
        , healthConnectRecordId, healthConnectClientRecordId, healthConnectDataOrigin, healthConnectSyncedAt
      FROM hydration_entries
      WHERE id = ?;
    `,
    [id],
  );

  return row === null ? null : mapRowToEntry(row);
};

export const deleteHydrationEntry = async (id: string): Promise<string> => {
  const database = await getDatabase();

  await database.runAsync('DELETE FROM hydration_entries WHERE id = ?;', [id]);

  return id;
};

export const deleteAllHydrationEntries = async (): Promise<void> => {
  const database = await getDatabase();

  await database.runAsync('DELETE FROM hydration_entries;', []);
};

export const getHealthConnectWritableEntries = async (): Promise<HydrationEntry[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<HydrationEntryRow>(
    `
      SELECT id, timestamp, amount, source, createdAt, updatedAt,
        healthConnectRecordId, healthConnectClientRecordId, healthConnectDataOrigin, healthConnectSyncedAt
      FROM hydration_entries
      WHERE source IN ('quick_add', 'custom', 'edit', 'widget')
        AND healthConnectRecordId IS NULL
      ORDER BY timestamp ASC;
    `,
    [],
  );

  return rows.map(mapRowToEntry);
};

export const hasHydrationEntryForHealthConnectRecord = async ({
  clientRecordId,
  healthConnectRecordId,
}: {
  clientRecordId?: string;
  healthConnectRecordId: string;
}): Promise<boolean> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ entryCount: number }>(
    `
      SELECT COUNT(*) AS entryCount
      FROM hydration_entries
      WHERE healthConnectRecordId = ?
        OR (? IS NOT NULL AND healthConnectClientRecordId = ?)
        OR (? IS NOT NULL AND id = ?);
    `,
    [
      healthConnectRecordId,
      clientRecordId ?? null,
      clientRecordId ?? null,
      clientRecordId ?? null,
      clientRecordId ?? null,
    ],
  );

  return (row?.entryCount ?? 0) > 0;
};

export const markHydrationEntriesSyncedToHealthConnect = async (
  updates: readonly { healthConnectRecordId: string; id: string; syncedAt: string }[],
): Promise<void> => {
  if (updates.length === 0) {
    return;
  }

  const database = await getDatabase();

  await database.execAsync('BEGIN TRANSACTION;');

  try {
    for (const update of updates) {
      await database.runAsync(
        `
          UPDATE hydration_entries
          SET healthConnectRecordId = ?,
            healthConnectClientRecordId = ?,
            healthConnectSyncedAt = ?,
            updatedAt = ?
          WHERE id = ?;
        `,
        [update.healthConnectRecordId, update.id, update.syncedAt, update.syncedAt, update.id],
      );
    }

    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
};

export const replaceHydrationEntries = async (
  entries: readonly HydrationEntry[],
): Promise<void> => {
  const database = await getDatabase();

  await database.execAsync('BEGIN TRANSACTION;');

  try {
    await database.runAsync('DELETE FROM hydration_entries;', []);

    for (const entry of entries) {
      await database.runAsync(
        `
          INSERT INTO hydration_entries (
            id,
            timestamp,
            amount,
            source,
            createdAt,
            updatedAt,
            healthConnectRecordId,
            healthConnectClientRecordId,
            healthConnectDataOrigin,
            healthConnectSyncedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          entry.id,
          entry.timestamp,
          entry.amount,
          entry.source,
          entry.createdAt,
          entry.updatedAt,
          entry.healthConnectRecordId ?? null,
          entry.healthConnectClientRecordId ?? null,
          entry.healthConnectDataOrigin ?? null,
          entry.healthConnectSyncedAt ?? null,
        ],
      );
    }

    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
};
