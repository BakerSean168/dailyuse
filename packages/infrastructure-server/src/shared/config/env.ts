/**
 * Environment Configuration
 * 鐜鍙橀噺閰嶇疆
 *
 * 鑱岃矗锟?
 * - 闆嗕腑绠＄悊搴旂敤鐜鍙橀噺
 * - 鎻愪緵绫诲瀷瀹夊叏鐨勭幆澧冮厤缃锟?
 * - 楠岃瘉蹇呴渶鐨勭幆澧冨彉锟?
 *
 * @module Shared/Infrastructure
 */

/**
 * 鐜閰嶇疆瀵硅薄
 */
export const env = {
  // 搴旂敤鐜
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 鏁版嵁搴撻厤锟?
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // API 閰嶇疆
  API_PORT: parseInt(process.env.API_PORT || '3000', 10),
  API_HOST: process.env.API_HOST || 'localhost',
  
  // AI 閰嶇疆
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  
  DEEPSEAK_API_KEY: process.env.DEEPSEAK_API_KEY || '',
  DEEPSEAK_BASE_URL: process.env.DEEPSEAK_BASE_URL || 'https://api.deepseek.com',
  
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  
  SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY || '',
  
  // Redis 閰嶇疆
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  
  // 鏃ュ織閰嶇疆
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // 璋冨害鍣ㄩ厤锟?
  SCHEDULER_ENABLED: process.env.SCHEDULER_ENABLED === 'true',
  SCHEDULER_TIMEZONE: process.env.SCHEDULER_TIMEZONE || 'UTC',
} as const;

/**
 * 妫€鏌ユ槸鍚︿负寮€鍙戠幆锟?
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * 妫€鏌ユ槸鍚︿负鐢熶骇鐜
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * 鑾峰彇 Redis 閰嶇疆
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
 * 楠岃瘉蹇呴渶鐨勭幆澧冨彉锟?
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
 * 鑾峰彇鐜鍙橀噺锛屽甫鍥為€€锟?
 */
export function getEnv<T extends keyof typeof env>(key: T, defaultValue?: string): string {
  const value = env[key];
  return (value as string) || defaultValue || '';
}
