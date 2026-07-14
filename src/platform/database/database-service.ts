export type DatabaseRunResult = {
  changes: number;
  lastInsertRowId: number;
};

export type DatabaseBindValue = boolean | number | string | null;

export type AppDatabase = {
  closeAsync?: () => Promise<void>;
  execAsync: (source: string) => Promise<void>;
  getAllAsync: <T>(source: string, params: DatabaseBindValue[]) => Promise<T[]>;
  getFirstAsync: <T>(source: string, params: DatabaseBindValue[]) => Promise<T | null>;
  runAsync: (source: string, params: DatabaseBindValue[]) => Promise<DatabaseRunResult>;
};

export const initializeDatabase = async (): Promise<AppDatabase> => {
  throw new Error('Database is not available on this platform.');
};

export const getDatabase = async (): Promise<AppDatabase> => {
  return initializeDatabase();
};

export const awaitDatabaseReady = async (): Promise<AppDatabase> => {
  return initializeDatabase();
};

export const resetDatabaseConnection = async (): Promise<void> => {};
