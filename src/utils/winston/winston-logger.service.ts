import { Injectable, type LoggerService } from '@nestjs/common';
import logger from '../logger';

type WinstonLevel = 'info' | 'error' | 'warn' | 'debug';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]) {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.write('warn', message, optionalParams);
  }

  debug?(message: unknown, ...optionalParams: unknown[]) {
    this.write('debug', message, optionalParams);
  }

  verbose?(message: unknown, ...optionalParams: unknown[]) {
    this.write('debug', message, optionalParams);
  }

  private write(
    level: WinstonLevel,
    message: unknown,
    optionalParams: unknown[],
  ) {
    const meta: Record<string, unknown> = {};

    if (level === 'error') {
      const trace =
        typeof optionalParams[0] === 'string' ? optionalParams[0] : undefined;
      const context =
        optionalParams.length >= 2 &&
        typeof optionalParams[optionalParams.length - 1] === 'string'
          ? (optionalParams[optionalParams.length - 1] as string)
          : undefined;

      if (trace) meta.trace = trace;
      if (context) meta.context = context;
    } else {
      const maybeContext = optionalParams[optionalParams.length - 1];
      if (typeof maybeContext === 'string') meta.context = maybeContext;
    }

    const msg =
      typeof message === 'string'
        ? message
        : message instanceof Error
          ? message.message
          : this.safeStringify(message);

    logger.log(level, msg, meta);
  }

  private safeStringify(value: unknown) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
