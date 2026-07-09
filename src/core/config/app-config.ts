import { appEnv } from '@core/env';

export const appConfig = {
  name: 'Water Reminder',
  motto: 'Hydration should become a habit, not a task.',
  env: appEnv.appEnvironment,
  apiBaseUrl: appEnv.apiBaseUrl,
  isDevelopment: appEnv.appEnvironment === 'development',
  isProduction: appEnv.appEnvironment === 'production',
  isTest: appEnv.appEnvironment === 'test',
} as const;
