import * as SQLite from 'expo-sqlite';

import { runDatabaseMigrations } from './migrations';

export type AppDatabase = SQLite.SQLiteDatabase;

const DATABASE_NAME = 'water_reminder.db';

let database: AppDatabase | null = null;
let databaseReadyPromise: Promise<AppDatabase> | null = null;

export const initializeDatabase = async (): Promise<AppDatabase> => {
  if (database) {
    return database;
  }

  if (databaseReadyPromise) {
    return databaseReadyPromise;
  }

  databaseReadyPromise = (async () => {
    const nextDatabase = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await nextDatabase.execAsync('PRAGMA foreign_keys = ON;');
    await nextDatabase.execAsync('PRAGMA journal_mode = WAL;');
    await runDatabaseMigrations(nextDatabase);
    database = nextDatabase;
    return nextDatabase;
  })();

  try {
    return await databaseReadyPromise;
  } catch (error) {
    databaseReadyPromise = null;
    throw error;
  }
};

export const getDatabase = async (): Promise<AppDatabase> => {
  return initializeDatabase();
};

export const awaitDatabaseReady = async (): Promise<AppDatabase> => {
  return initializeDatabase();
};

export const resetDatabaseConnection = async (): Promise<void> => {
  if (databaseReadyPromise) {
    await databaseReadyPromise.catch(() => undefined);
    databaseReadyPromise = null;
  }

  if (database === null) {
    return;
  }

  await database.closeAsync();
  database = null;
};
