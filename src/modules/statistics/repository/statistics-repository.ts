import { getDatabase } from '@platform/database';

import { getLocalDayBounds } from '../../hydration/utils/date';
import type { DailyHydrationTotal, HourlyHydrationTotal } from '../types/statistics';

type DailyTotalRow = {
  dateKey: string;
  entryCount: number;
  totalAmount: number;
};

type HourlyTotalRow = {
  entryCount: number;
  hour: number;
  totalAmount: number;
};

const mapDailyTotalRow = (row: DailyTotalRow): DailyHydrationTotal => ({
  dateKey: row.dateKey,
  entryCount: row.entryCount,
  totalAmount: row.totalAmount,
});

export const getDailyHydrationTotalsBetween = async ({
  endDate,
  startDate,
}: {
  endDate: Date;
  startDate: Date;
}): Promise<DailyHydrationTotal[]> => {
  const database = await getDatabase();
  const startBounds = getLocalDayBounds(startDate);
  const endBounds = getLocalDayBounds(endDate);
  const rows = await database.getAllAsync<DailyTotalRow>(
    `
      SELECT
        strftime('%Y-%m-%d', timestamp, 'localtime') AS dateKey,
        SUM(amount) AS totalAmount,
        COUNT(*) AS entryCount
      FROM hydration_entries
      WHERE timestamp >= ? AND timestamp < ?
      GROUP BY dateKey
      ORDER BY dateKey ASC;
    `,
    [startBounds.startIso, endBounds.endIso],
  );

  return rows.map(mapDailyTotalRow);
};

export const getAllDailyHydrationTotals = async (): Promise<DailyHydrationTotal[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<DailyTotalRow>(
    `
      SELECT
        strftime('%Y-%m-%d', timestamp, 'localtime') AS dateKey,
        SUM(amount) AS totalAmount,
        COUNT(*) AS entryCount
      FROM hydration_entries
      GROUP BY dateKey
      ORDER BY dateKey ASC;
    `,
    [],
  );

  return rows.map(mapDailyTotalRow);
};

export const getHourlyHydrationDistributionBetween = async ({
  endDate,
  startDate,
}: {
  endDate: Date;
  startDate: Date;
}): Promise<HourlyHydrationTotal[]> => {
  const database = await getDatabase();
  const startBounds = getLocalDayBounds(startDate);
  const endBounds = getLocalDayBounds(endDate);
  const rows = await database.getAllAsync<HourlyTotalRow>(
    `
      SELECT
        CAST(strftime('%H', timestamp, 'localtime') AS INTEGER) AS hour,
        SUM(amount) AS totalAmount,
        COUNT(*) AS entryCount
      FROM hydration_entries
      WHERE timestamp >= ? AND timestamp < ?
      GROUP BY hour
      ORDER BY entryCount DESC, totalAmount DESC;
    `,
    [startBounds.startIso, endBounds.endIso],
  );

  return rows.map((row) => ({
    entryCount: row.entryCount,
    hour: row.hour,
    totalAmount: row.totalAmount,
  }));
};
