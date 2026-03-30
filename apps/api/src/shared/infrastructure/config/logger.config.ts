/**
 * @file logger.config.ts
 * @description API 日志系统配置，集成 @dailyuse/utils 的 Winston 实现。
 * @date 2025-01-22
 */

import { LoggerFactory } from '@dailyuse/utils';
import { WinstonLogger } from '@dailyuse/utils/winston';
import { env, isProduction } from './env.js';

const logLevel = env.LOG_LEVEL;

/**
 * 初始化日志系统。
 *
 * @remarks
 * 注册 WinstonLogger 提供者，配置日志级别和生产环境行为。
 */
export function initializeLogger(): void {
  // 注册 WinstonLogger 提供者
  LoggerFactory.registerProvider((context) => {
    const logger = new WinstonLogger(context);
    // WinstonLogger 内部已经配置了 Console 和 DailyRotateFile
    return logger;
  });

  LoggerFactory.configure({
    level: logLevel,
    enableInProduction: true,
  });
}

/**
 * 获取应用启动信息。
 *
 * @returns {Record<string, any>} 包含环境、Node 版本、平台、日志级别等信息的对象
 */
export function getStartupInfo(): Record<string, any> {
  return {
    environment: env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    logLevel: env.LOG_LEVEL,
    timestamp: new Date().toISOString(),
  };
}
