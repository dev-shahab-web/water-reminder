export type AppDatabase = null;

export const initializeDatabase = async (): Promise<AppDatabase> => {
  return null;
};

export const getDatabase = async (): Promise<AppDatabase> => {
  return initializeDatabase();
};
