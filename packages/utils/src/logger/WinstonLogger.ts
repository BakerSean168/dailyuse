/**
 * Winston Logger Implementation
 * 
 * Wraps winston logger to implement ILogger interface
 */

import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import type { ILogger, LogLevelString } from './types';

export class WinstonLogger implements ILogger {
  private logger: winston.Logger;
  public readonly context: string;

  constructor(context: string, options?: winston.LoggerOptions) {
    this.context = context;

    // Default configuration
    const defaultOptions: winston.LoggerOptions = {
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { context },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              return `${timestamp} [${level}] [${context || 'Application'}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            })
          ),
        }),
        // File transport (Daily Rotate)
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        // Error file transport
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    };

    this.logger = winston.createLogger({
      ...defaultOptions,
      ...options,
    });
  }

  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(message, ...meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.logger.info(message, ...meta);
  }

  http(message: string, ...meta: unknown[]): void {
    this.logger.http(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, error?: unknown, ...meta: unknown[]): void {
    if (error instanceof Error) {
      this.logger.error(message, { ...meta, error: { message: error.message, stack: error.stack, name: error.name } });
    } else {
      this.logger.error(message, { ...meta, error });
    }
  }

  child(subContext: string): ILogger {
    return new WinstonLogger(`${this.context}:${subContext}`);
  }

  setLevel(level: LogLevelString): void {
    this.logger.level = level;
  }
  
  // Helper to get internal winston instance if needed
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}
