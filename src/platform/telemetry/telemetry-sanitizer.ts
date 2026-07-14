import {
  type HandledErrorContext,
  type TelemetryEventName,
  type TelemetryParameters,
  type TelemetryScreenName,
  telemetryEvents,
  telemetryScreens,
} from './telemetry-events';

const allowedEventNames = new Set<string>(telemetryEvents);
const allowedScreenNames = new Set<string>(telemetryScreens);
const allowedParameterKeys = new Set(['connected', 'result', 'screen_name', 'source', 'theme']);
const prohibitedKeyFragments = [
  'amount',
  'content',
  'database',
  'date',
  'duration',
  'email',
  'entry',
  'file',
  'goal',
  'healthconnect',
  'history',
  'hydration',
  'id',
  'location',
  'milliliter',
  'ml',
  'notification',
  'percent',
  'record',
  'reminder_time',
  'schedule',
  'sql',
  'text',
  'timestamp',
  'total',
];

export type SanitizedTelemetryEvent = {
  name: TelemetryEventName;
  parameters: TelemetryParameters;
};

export type SanitizedHandledError = {
  attributes: Record<string, string>;
  category: string;
  message: string;
};

export const sanitizeTelemetryEvent = (
  name: string,
  parameters: Record<string, unknown> = {},
): SanitizedTelemetryEvent | undefined => {
  if (!allowedEventNames.has(name)) {
    rejectUnsafeTelemetry(`Unknown telemetry event: ${name}`);
    return undefined;
  }

  const sanitizedParameters: Record<string, boolean | string> = {};

  for (const [key, value] of Object.entries(parameters)) {
    const normalizedKey = key.toLowerCase();

    if (!allowedParameterKeys.has(key) || containsProhibitedFragment(normalizedKey)) {
      rejectUnsafeTelemetry(`Unsafe telemetry parameter: ${key}`);
      return undefined;
    }

    if (key === 'screen_name') {
      const screenName = sanitizeScreenName(value);

      if (screenName === undefined) {
        return undefined;
      }

      sanitizedParameters.screen_name = screenName;
      continue;
    }

    if (key === 'source' && (value === 'app' || value === 'notification' || value === 'widget')) {
      sanitizedParameters.source = value;
      continue;
    }

    if (key === 'result' && (value === 'success' || value === 'cancelled' || value === 'failed')) {
      sanitizedParameters.result = value;
      continue;
    }

    if (key === 'theme' && (value === 'system' || value === 'light' || value === 'dark')) {
      sanitizedParameters.theme = value;
      continue;
    }

    if (key === 'connected' && typeof value === 'boolean') {
      sanitizedParameters.connected = value;
      continue;
    }

    rejectUnsafeTelemetry(`Invalid telemetry parameter value: ${key}`);
    return undefined;
  }

  return {
    name: name as TelemetryEventName,
    parameters: sanitizedParameters,
  };
};

export const sanitizeScreenName = (value: unknown): TelemetryScreenName | undefined => {
  if (typeof value !== 'string') {
    rejectUnsafeTelemetry('Screen name must be a string.');
    return undefined;
  }

  const sanitized = value.split('?')[0]?.replace(/^\/+/, '').replace(/\/+.*/, '') || 'home';
  const screenName = sanitized === '' ? 'home' : sanitized;

  if (!allowedScreenNames.has(screenName)) {
    rejectUnsafeTelemetry(`Unsafe screen route: ${value}`);
    return undefined;
  }

  return screenName as TelemetryScreenName;
};

export const sanitizeHandledError = (
  operationName: string,
  error: unknown,
  context: HandledErrorContext = {},
): SanitizedHandledError | undefined => {
  if (!isAllowedOperation(operationName)) {
    rejectUnsafeTelemetry(`Unknown handled error operation: ${operationName}`);
    return undefined;
  }

  const attributes: Record<string, string> = {
    operation_name: operationName,
  };

  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) {
      continue;
    }

    if (!isAllowedCrashlyticsAttribute(key)) {
      rejectUnsafeTelemetry(`Unsafe Crashlytics attribute: ${key}`);
      return undefined;
    }

    attributes[key] = String(value);
  }

  const errorName = error instanceof Error ? error.name : 'Error';

  return {
    attributes,
    category: operationName,
    message: `${errorName}: ${operationName}`,
  };
};

const isAllowedOperation = (operationName: string) => {
  return [
    'database_initialization_failed',
    'hydration_write_failed',
    'widget_refresh_failed',
    'health_connect_sync_failed',
    'reminder_schedule_failed',
    'import_failed',
    'export_failed',
  ].includes(operationName);
};

const isAllowedCrashlyticsAttribute = (key: string) => {
  return [
    'app_version',
    'build_number',
    'database_ready',
    'error_category',
    'health_connect_available',
    'operation_name',
    'route_name',
    'source',
    'widget_available',
  ].includes(key);
};

const containsProhibitedFragment = (key: string) => {
  return prohibitedKeyFragments.some((fragment) => key.includes(fragment));
};

const rejectUnsafeTelemetry = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(message);
  }
};
