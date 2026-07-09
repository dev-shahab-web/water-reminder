import { appEnv } from '@core/env';

export const appConfig = {
  env: appEnv.appEnvironment,
  apiBaseUrl: appEnv.apiBaseUrl,
  isDevelopment: appEnv.appEnvironment === 'development',
  isProduction: appEnv.appEnvironment === 'production',
  isTest: appEnv.appEnvironment === 'test',
} as const;
