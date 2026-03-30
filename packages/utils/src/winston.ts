/**
 * Winston Logger 导出入口
 * 仅限 Node.js 环境使用
 */

import { LoggerFactory } from './logger/LoggerFactory';
import type { LogLevelString } from './logger/types';
import { WinstonLogger } from './logger/WinstonLogger';

export interface InitializeWinstonLoggerOptions {
  /** Absolute or runtime-relative directory where rotated log files are stored. */
  logsDir?: string;
  level?: LogLevelString;
  enableInProduction?: boolean;
  enableFileLogging?: boolean;
}

export function initializeWinstonLogger(options: InitializeWinstonLoggerOptions = {}): void {
  const {
    logsDir = 'logs',
    level = 'info',
    enableInProduction = true,
    enableFileLogging = true,
  } = options;

  LoggerFactory.registerProvider((context) => new WinstonLogger(context, {
    logsDir,
    enableFileLogging,
  }));

  // Provider registration and level configuration are separate so cached
  // FactoryLogger proxies can refresh against the newest provider and config.
  LoggerFactory.configure({
    level,
    enableInProduction,
  });
}

export { WinstonLogger };
