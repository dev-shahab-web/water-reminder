export type LogContext = Record<string, unknown>;

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
};

const writeLog = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context?: LogContext,
) => {
  const payload = context ? [message, context] : [message];

  if (process.env.NODE_ENV === 'test' && level !== 'error') {
    return;
  }

  console[level](...payload);
};

export const logger: Logger = {
  debug: (message, context) => writeLog('debug', message, context),
  error: (message, context) => writeLog('error', message, context),
  info: (message, context) => writeLog('info', message, context),
  warn: (message, context) => writeLog('warn', message, context),
};
