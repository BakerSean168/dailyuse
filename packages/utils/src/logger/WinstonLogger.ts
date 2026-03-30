/**
 * Winston Logger Implementation
 * 
 * Wraps winston logger to implement ILogger interface
 */

import * as winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'node:fs';
import path from 'node:path';
import type { ILogger, LogLevelString } from './types';

export interface WinstonLoggerOptions extends winston.LoggerOptions {
  /**
   * Target directory for rotated log files.
   * The caller owns choosing an app-specific data directory such as
   * `<workspace>/data/logs` for the API or `<userData>/data/logs` for desktop.
   */
  logsDir?: string;
  /** Allow console-only mode for runtimes that should not persist files. */
  enableFileLogging?: boolean;
}

export class WinstonLogger implements ILogger {
  private logger: winston.Logger;
  public readonly context: string;

  constructor(context: string, options: WinstonLoggerOptions = {}) {
    this.context = context;

    const {
      logsDir = 'logs',
      enableFileLogging = true,
      ...winstonOptions
    } = options;

    const transports: winston.transport[] = [
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
    ];

    if (enableFileLogging) {
      // Keep directory creation close to transport setup so the runtime only
      // needs to provide a path, not duplicate file-system bootstrap logic.
      fs.mkdirSync(logsDir, { recursive: true });

      transports.push(
        new winston.transports.DailyRotateFile({
          filename: path.join(logsDir, 'app-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.DailyRotateFile({
          filename: path.join(logsDir, 'error-%DATE%.log'),
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
      );
    }

    // Default configuration
    const defaultOptions: winston.LoggerOptions = {
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { context },
      transports,
    };

    this.logger = winston.createLogger({
      ...defaultOptions,
      ...winstonOptions,
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
