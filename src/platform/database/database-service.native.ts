import * as SQLite from 'expo-sqlite';

import { runDatabaseMigrations } from './migrations';

export type AppDatabase = SQLite.SQLiteDatabase;

const DATABASE_NAME = 'water_reminder.db';

let database: AppDatabase | null = null;

export const initializeDatabase = async (): Promise<AppDatabase> => {
  if (!database) {
    database = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await database.execAsync('PRAGMA foreign_keys = ON;');
    await database.execAsync('PRAGMA journal_mode = WAL;');
    await runDatabaseMigrations(database);
  }

  return database;
};

export const getDatabase = async (): Promise<AppDatabase> => {
  return initializeDatabase();
};

export const resetDatabaseConnection = async (): Promise<void> => {
  if (database === null) {
    return;
  }

  await database.closeAsync();
  database = null;
};
