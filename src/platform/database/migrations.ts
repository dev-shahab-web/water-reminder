import type { AppDatabase } from './database-service';

export const runDatabaseMigrations = async (database: AppDatabase): Promise<void> => {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS hydration_entries (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK (amount > 0),
      source TEXT NOT NULL CHECK (source IN ('quick_add', 'custom', 'edit')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_hydration_entries_timestamp
      ON hydration_entries (timestamp);
  `);
};
