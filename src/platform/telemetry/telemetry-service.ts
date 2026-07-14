import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import Constants from 'expo-constants';

import { logger } from '@core/logger';

import {
  type HandledErrorContext,
  type HandledErrorOperation,
  type TelemetryEventName,
  type TelemetryParameters,
  type TelemetryScreenName,
} from './telemetry-events';
import { isTelemetryEnabled, setTelemetryConsent } from './telemetry-consent';
import {
  sanitizeHandledError,
  sanitizeScreenName,
  sanitizeTelemetryEvent,
} from './telemetry-sanitizer';

let initialized = false;
let lastTrackedScreen: TelemetryScreenName | undefined;

export const initializeTelemetry = async (): Promise<void> => {
  const enabled = isTelemetryEnabled();

  await safelyRunTelemetryOperation(async () => {
    await analytics().setAnalyticsCollectionEnabled(enabled);
    await crashlytics().setCrashlyticsCollectionEnabled(enabled);
    await crashlytics().setAttributes({
      app_version: Constants.expoConfig?.version ?? '1.0.0',
      build_number:
        Constants.expoConfig?.android?.versionCode === undefined
          ? 'Local build'
          : String(Constants.expoConfig.android.versionCode),
    });
  });

  initialized = true;
  void trackEvent('app_open');
};

export const setTelemetryEnabled = async (enabled: boolean): Promise<void> => {
  setTelemetryConsent(enabled);

  await safelyRunTelemetryOperation(async () => {
    await analytics().setAnalyticsCollectionEnabled(enabled);
    await crashlytics().setCrashlyticsCollectionEnabled(enabled);
  });
};

export { isTelemetryEnabled };

export const trackEvent = (
  name: TelemetryEventName,
  parameters: TelemetryParameters = {},
): void => {
  const sanitizedEvent = sanitizeTelemetryEvent(name, parameters);

  if (sanitizedEvent === undefined) {
    return;
  }

  if (!isTelemetryEnabled()) {
    logDevelopmentTelemetry('Telemetry event skipped because diagnostics are disabled.', {
      event: sanitizedEvent,
    });
    return;
  }

  void safelyRunTelemetryOperation(async () => {
    await analytics().logEvent(sanitizedEvent.name, sanitizedEvent.parameters);
  });
};

export const trackEventSafely = (
  name: TelemetryEventName,
  parameters: TelemetryParameters = {},
): void => {
  try {
    trackEvent(name, parameters);
  } catch (error) {
    logDevelopmentTelemetry('Telemetry event rejected before dispatch.', { error, name });
  }
};

export const trackScreen = (routeName: string): void => {
  const screenName = sanitizeScreenName(routeName);

  if (screenName === undefined || screenName === lastTrackedScreen) {
    return;
  }

  lastTrackedScreen = screenName;
  trackEvent('screen_view', { screen_name: screenName });

  if (isTelemetryEnabled()) {
    void safelyRunTelemetryOperation(async () => {
      await analytics().logScreenView({
        screen_class: screenName,
        screen_name: screenName,
      });
      await crashlytics().setAttribute('route_name', screenName);
    });
  }
};

export const recordHandledError = (
  operationName: HandledErrorOperation,
  error: unknown,
  context: HandledErrorContext = {},
): void => {
  const sanitizedError = sanitizeHandledError(operationName, error, {
    ...context,
    operation_name: operationName,
  });

  if (sanitizedError === undefined) {
    return;
  }

  if (!isTelemetryEnabled()) {
    logDevelopmentTelemetry('Handled telemetry error skipped because diagnostics are disabled.', {
      error: sanitizedError,
    });
    return;
  }

  void safelyRunTelemetryOperation(async () => {
    await crashlytics().setAttributes(sanitizedError.attributes);
    crashlytics().recordError(new Error(sanitizedError.message), sanitizedError.category);
  });
};

const safelyRunTelemetryOperation = async (operation: () => Promise<void> | void) => {
  try {
    await operation();
  } catch (error) {
    logDevelopmentTelemetry('Telemetry operation failed.', { error });
  }
};

const logDevelopmentTelemetry = (message: string, context?: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(message, {
      initialized,
      ...context,
    });
  }
};
