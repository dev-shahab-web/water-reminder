export type AppEnvironment = 'development' | 'staging' | 'production' | 'test';

const allowedAppEnvironments: readonly AppEnvironment[] = [
  'development',
  'staging',
  'production',
  'test',
];

const resolveAppEnvironment = (value: string | undefined): AppEnvironment => {
  if (value && allowedAppEnvironments.includes(value as AppEnvironment)) {
    return value as AppEnvironment;
  }

  return process.env.NODE_ENV === 'test' ? 'test' : 'development';
};

export const appEnv = {
  appEnvironment: resolveAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV),
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
} as const;
