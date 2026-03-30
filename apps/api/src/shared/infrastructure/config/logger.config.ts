/**
 * @file logger.config.ts
 * @description API 日志系统配置，集成 @dailyuse/utils 的 Winston 实现。
 * @date 2025-01-22
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeWinstonLogger } from '@dailyuse/utils/winston';
import { env } from './env.js';

const logLevel = env.LOG_LEVEL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../../../../../../');
// API logs are stored in the repository data directory so local development and
// server-style runs share a predictable persisted location outside build output.
const API_LOGS_DIR = resolve(PROJECT_ROOT, 'data', 'logs');

/**
 * 初始化日志系统。
 *
 * @remarks
 * 注册 WinstonLogger 提供者，配置日志级别和生产环境行为。
 */
export function initializeLogger(): void {
  initializeWinstonLogger({
    logsDir: API_LOGS_DIR,
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
