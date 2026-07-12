import type { AppDatabase } from './database-service';

type TableColumn = {
  name: string;
};

export const runDatabaseMigrations = async (database: AppDatabase): Promise<void> => {
  const columns = await database.getAllAsync<TableColumn>(
    'PRAGMA table_info(hydration_entries);',
    [],
  );
  const columnNames = new Set(columns.map((column) => column.name));
  const needsHealthConnectMigration =
    columns.length > 0 && !columnNames.has('healthConnectRecordId');
  const createHydrationEntriesSql = `
    CREATE TABLE IF NOT EXISTS hydration_entries (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK (amount > 0),
      source TEXT NOT NULL CHECK (source IN ('quick_add', 'custom', 'edit', 'health_connect', 'widget')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      healthConnectRecordId TEXT UNIQUE,
      healthConnectClientRecordId TEXT UNIQUE,
      healthConnectDataOrigin TEXT,
      healthConnectSyncedAt TEXT
    );
  `;

  if (needsHealthConnectMigration) {
    await database.execAsync(`
      ${createHydrationEntriesSql.replace('hydration_entries', 'hydration_entries_v2')}

      INSERT OR IGNORE INTO hydration_entries_v2 (
        id,
        timestamp,
        amount,
        source,
        createdAt,
        updatedAt
      )
      SELECT
        id,
        timestamp,
        amount,
        source,
        createdAt,
        updatedAt
      FROM hydration_entries;

      DROP TABLE hydration_entries;
      ALTER TABLE hydration_entries_v2 RENAME TO hydration_entries;
    `);
  }

  const refreshedColumns = needsHealthConnectMigration
    ? await database.getAllAsync<TableColumn>('PRAGMA table_info(hydration_entries);', [])
    : columns;
  const hasHydrationTable = refreshedColumns.length > 0;
  const sourceSql = hasHydrationTable
    ? await database.getFirstAsync<{ sql: string }>(
        `
          SELECT sql
          FROM sqlite_master
          WHERE type = 'table' AND name = 'hydration_entries';
        `,
        [],
      )
    : null;
  const needsWidgetSourceMigration =
    sourceSql?.sql !== undefined &&
    sourceSql.sql.includes('health_connect') &&
    !sourceSql.sql.includes("'widget'");

  if (needsWidgetSourceMigration) {
    await database.execAsync(`
      ${createHydrationEntriesSql.replace('hydration_entries', 'hydration_entries_v3')}

      INSERT OR IGNORE INTO hydration_entries_v3 (
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
      SELECT
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
      FROM hydration_entries;

      DROP TABLE hydration_entries;
      ALTER TABLE hydration_entries_v3 RENAME TO hydration_entries;
    `);
  }

  await database.execAsync(`
    ${createHydrationEntriesSql}

    CREATE INDEX IF NOT EXISTS idx_hydration_entries_timestamp
      ON hydration_entries (timestamp);

    CREATE INDEX IF NOT EXISTS idx_hydration_entries_health_connect_record
      ON hydration_entries (healthConnectRecordId);

    CREATE INDEX IF NOT EXISTS idx_hydration_entries_health_connect_client_record
      ON hydration_entries (healthConnectClientRecordId);

    CREATE TABLE IF NOT EXISTS widget_actions (
      actionId TEXT PRIMARY KEY NOT NULL,
      amount INTEGER NOT NULL CHECK (amount > 0),
      createdAt TEXT NOT NULL
    );
  `);
};
