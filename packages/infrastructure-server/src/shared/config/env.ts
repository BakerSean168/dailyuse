/**
 * Environment Configuration
 * 环境变量配置
 *
 * 职责�?
 * - 集中管理应用环境变量
 * - 提供类型安全的环境配置访�?
 * - 验证必需的环境变�?
 *
 * @module Shared/Infrastructure
 */

/**
 * 环境配置对象
 */
export const env = {
  // 应用环境
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 数据库配�?
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // API 配置
  API_PORT: parseInt(process.env.API_PORT || '3000', 10),
  API_HOST: process.env.API_HOST || 'localhost',
  
  // AI 配置
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  
  DEEPSEAK_API_KEY: process.env.DEEPSEAK_API_KEY || '',
  DEEPSEAK_BASE_URL: process.env.DEEPSEAK_BASE_URL || 'https://api.deepseek.com',
  
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  
  SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY || '',
  
  // Redis 配置
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  
  // 日志配置
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // 调度器配�?
  SCHEDULER_ENABLED: process.env.SCHEDULER_ENABLED === 'true',
  SCHEDULER_TIMEZONE: process.env.SCHEDULER_TIMEZONE || 'UTC',
} as const;

/**
 * 检查是否为开发环�?
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * 获取 Redis 配置
 */
export function getRedisConfig(): Record<string, any> {
  if (env.REDIS_URL) {
    return { url: env.REDIS_URL };
  }
  
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
  };
}

/**
 * 验证必需的环境变�?
 */
export function validateEnv(): void {
  const required = ['DATABASE_URL'] as const;
  
  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`Warning: Environment variable ${key} is not set`);
    }
  }
}

/**
 * 获取环境变量，带回退�?
 */
export function getEnv<T extends keyof typeof env>(key: T, defaultValue?: string): string {
  const value = env[key];
  return (value as string) || defaultValue || '';
}
