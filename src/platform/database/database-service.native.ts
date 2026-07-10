import * as SQLite from 'expo-sqlite';

export type AppDatabase = SQLite.SQLiteDatabase;

const DATABASE_NAME = 'water_reminder.db';

let database: AppDatabase | null = null;

export const initializeDatabase = async (): Promise<AppDatabase> => {
  if (!database) {
    database = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await database.execAsync('PRAGMA foreign_keys = ON;');
    await database.execAsync('PRAGMA journal_mode = WAL;');
  }

  return database;
};

export const getDatabase = async (): Promise<AppDatabase> => {
  return initializeDatabase();
};
