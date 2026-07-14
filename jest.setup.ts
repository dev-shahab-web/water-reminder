import '@testing-library/react-native';
import { jest } from '@jest/globals';

jest.mock('@react-native-firebase/analytics', () => {
  const analytics = () => ({
    logEvent: jest.fn(async () => undefined),
    logScreenView: jest.fn(async () => undefined),
    setAnalyticsCollectionEnabled: jest.fn(async () => undefined),
  });

  return analytics;
});

jest.mock('@react-native-firebase/crashlytics', () => {
  const crashlytics = () => ({
    recordError: jest.fn(),
    setAttribute: jest.fn(async () => undefined),
    setAttributes: jest.fn(async () => undefined),
    setCrashlyticsCollectionEnabled: jest.fn(async () => undefined),
  });

  return crashlytics;
});
