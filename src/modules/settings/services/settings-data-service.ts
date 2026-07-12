import {
  deleteAllHydrationEntries,
  getAllHydrationEntries,
  getHydrationDatabaseSizeBytes,
  getHydrationEntryCount,
  replaceHydrationEntries,
} from '@modules/hydration/repository/hydration-repository';
import type { HydrationEntry, HydrationEntrySource } from '@modules/hydration/types';

import type { HydrationDataExport, HydrationDataExportEntry } from '../types';

export type SettingsDataSummary = {
  databaseSizeBytes: number;
  totalEntries: number;
};

const validSources = new Set<HydrationEntrySource>([
  'quick_add',
  'custom',
  'edit',
  'health_connect',
  'widget',
]);

const isExportEntry = (value: unknown): value is HydrationDataExportEntry => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.timestamp === 'string' &&
    typeof candidate.amount === 'number' &&
    candidate.amount > 0 &&
    typeof candidate.source === 'string' &&
    validSources.has(candidate.source as HydrationEntrySource) &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    (candidate.healthConnectRecordId === undefined ||
      typeof candidate.healthConnectRecordId === 'string') &&
    (candidate.healthConnectClientRecordId === undefined ||
      typeof candidate.healthConnectClientRecordId === 'string') &&
    (candidate.healthConnectDataOrigin === undefined ||
      typeof candidate.healthConnectDataOrigin === 'string') &&
    (candidate.healthConnectSyncedAt === undefined ||
      typeof candidate.healthConnectSyncedAt === 'string')
  );
};

const parseHydrationExport = (payload: string): HydrationDataExport => {
  const parsedValue = JSON.parse(payload) as unknown;

  if (typeof parsedValue !== 'object' || parsedValue === null) {
    throw new Error('Import file is not a Water Reminder export.');
  }

  const candidate = parsedValue as Record<string, unknown>;

  if (
    candidate.schemaVersion !== 1 ||
    candidate.source !== 'water-reminder' ||
    !Array.isArray(candidate.entries)
  ) {
    throw new Error('Import file is not a Water Reminder export.');
  }

  if (!candidate.entries.every(isExportEntry)) {
    throw new Error('Import file contains unsupported hydration entries.');
  }

  return {
    entries: candidate.entries,
    exportedAt:
      typeof candidate.exportedAt === 'string' ? candidate.exportedAt : new Date().toISOString(),
    schemaVersion: 1,
    source: 'water-reminder',
  };
};

export const getSettingsDataSummary = async (): Promise<SettingsDataSummary> => {
  const [databaseSizeBytes, totalEntries] = await Promise.all([
    getHydrationDatabaseSizeBytes(),
    getHydrationEntryCount(),
  ]);

  return {
    databaseSizeBytes,
    totalEntries,
  };
};

export const exportHydrationDatabase = async (): Promise<string> => {
  const entries = await getAllHydrationEntries();
  const exportPayload: HydrationDataExport = {
    entries,
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: 'water-reminder',
  };

  return JSON.stringify(exportPayload, null, 2);
};

export const importHydrationDatabase = async (payload: string): Promise<number> => {
  const hydrationExport = parseHydrationExport(payload);
  const entries: HydrationEntry[] = hydrationExport.entries.map((entry) => ({
    amount: entry.amount,
    createdAt: entry.createdAt,
    healthConnectClientRecordId: entry.healthConnectClientRecordId,
    healthConnectDataOrigin: entry.healthConnectDataOrigin,
    healthConnectRecordId: entry.healthConnectRecordId,
    healthConnectSyncedAt: entry.healthConnectSyncedAt,
    id: entry.id,
    source: entry.source as HydrationEntrySource,
    timestamp: entry.timestamp,
    updatedAt: entry.updatedAt,
  }));

  await replaceHydrationEntries(entries);

  return entries.length;
};

export const deleteHydrationHistory = async (): Promise<void> => {
  await deleteAllHydrationEntries();
};

export const formatDatabaseSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
