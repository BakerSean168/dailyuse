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
 * 默认 Logger 提供者 (使用简单的 Console Logger)
 */
let loggerProvider: LoggerProvider = (context, config) => {
  const logger = new Logger(context, config);
  // 默认添加控制台传输器
  logger.addTransport(new ConsoleTransport());
  return logger;
};

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
    // 清除缓存，强制重新创建
    loggerCache.clear();
  }

  /**
   * 配置全局 Logger
   */
  static configure(config: Partial<LoggerConfig>): void {
    globalConfig = {
      ...globalConfig,
      ...config,
    };

    // 清除缓存，强制重新创建
    loggerCache.clear();
  }

  /**
   * 创建 Logger 实例
   */
  static create(context: string, useCache = true): ILogger {
    if (useCache && loggerCache.has(context)) {
      return loggerCache.get(context)!;
    }

    // 使用当前的提供者创建 Logger
    const logger = loggerProvider(context, globalConfig);

    // 应用全局配置的日志级别 (再次确认，防止提供者忽略)
    if (globalConfig.level) {
      logger.setLevel(globalConfig.level);
    }

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
