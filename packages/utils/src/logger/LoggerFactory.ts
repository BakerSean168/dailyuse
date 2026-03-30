/**
 * Logger 工厂
 * 管理全局 Logger 配置和实例
 */

import { Logger } from './Logger';
import { ConsoleTransport } from './transports/ConsoleTransport';
import type { ILogger, LoggerConfig } from './types';

/**
 * 全局配置
 */
let globalConfig: Partial<LoggerConfig> = {
  level: 'info',
  enableInProduction: false,
};

/**
 * Logger 实例缓存
 */
const loggerCache = new Map<string, ILogger>();

/**
 * Logger 提供者类型
 */
export type LoggerProvider = (context: string, config?: Partial<LoggerConfig>) => ILogger;

/**
 * Stable proxy returned by `createLogger`.
 *
 * Many packages create loggers at module-load time. If the real provider is
 * registered later during app bootstrap, callers should still transparently
 * switch from the default console logger to the runtime-specific logger
 * implementation (for example Winston file logging in Node.js).
 */
class FactoryLogger implements ILogger {
  private logger: ILogger;

  constructor(
    public readonly context: string,
    private readonly createLoggerInstance: (context: string) => ILogger,
  ) {
    this.logger = this.createLoggerInstance(context);
  }

  refresh(): void {
    this.logger = this.createLoggerInstance(this.context);
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
    this.logger.error(message, error, ...meta);
  }

  child(subContext: string): ILogger {
    return LoggerFactory.create(`${this.context}:${subContext}`);
  }

  setLevel(level: NonNullable<LoggerConfig['level']>): void {
    this.logger.setLevel(level);
  }
}

/**
 * 默认 Logger 提供者 (使用简单的 Console Logger)
 */
let loggerProvider: LoggerProvider = (context, config) => {
  const logger = new Logger(context, config);
  // 默认添加控制台传输器
  logger.addTransport(new ConsoleTransport());
  return logger;
};

function createLoggerInstance(context: string): ILogger {
  const logger = loggerProvider(context, globalConfig);

  // 应用全局配置的日志级别 (再次确认，防止提供者忽略)
  if (globalConfig.level) {
    logger.setLevel(globalConfig.level);
  }

  return logger;
}

function refreshCachedLoggers(): void {
  // Refresh existing logger proxies in place so already-imported modules pick up
  // the current provider and config without recreating their logger bindings.
  for (const logger of loggerCache.values()) {
    if (logger instanceof FactoryLogger) {
      logger.refresh();
    }
  }
}

/**
 * Logger 工厂类
 */
export class LoggerFactory {
  /**
   * 注册自定义 Logger 提供者
   * 用于在 Node.js 环境注入 WinstonLogger
   */
  static registerProvider(provider: LoggerProvider): void {
    loggerProvider = provider;
    refreshCachedLoggers();
  }

  /**
   * 配置全局 Logger
   */
  static configure(config: Partial<LoggerConfig>): void {
    globalConfig = {
      ...globalConfig,
      ...config,
    };

    refreshCachedLoggers();
  }

  /**
   * 创建 Logger 实例
   */
  static create(context: string, useCache = true): ILogger {
    if (useCache && loggerCache.has(context)) {
      return loggerCache.get(context)!;
    }

    const logger = new FactoryLogger(context, createLoggerInstance);

    if (useCache) {
      loggerCache.set(context, logger);
    }

    return logger;
  }

  /**
   * 获取全局配置
   */
  static getConfig(): Partial<LoggerConfig> {
    return { ...globalConfig };
  }

  /**
   * 清除所有缓存的 Logger
   */
  static clearCache(): void {
    loggerCache.clear();
  }
}

/**
 * 便捷函数：创建 Logger
 */
export function createLogger(context: string): ILogger {
  return LoggerFactory.create(context);
}
