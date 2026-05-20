/**
 * @file env.schema.ts
 * @description 环境变量 Zod Schema 定义
 * 统一所有环境变量的类型验证和默认值
 * @date 2025-12-22
 */

import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

/**
 * 环境变量 Schema
 *
 * 分类:
 * 1. 应用基础配置 - NODE_ENV, API_PORT, API_HOST, LOG_LEVEL
 * 2. 数据库配置 - DATABASE_URL, DB_*
 * 3. Redis 缓存 - REDIS_URL, REDIS_*
 * 4. 认证配置 - JWT_*
 * 5. CORS 配置 - CORS_ORIGIN
 * 6. AI 服务 - OPENAI_*, QI_NIU_YUN_*
 * 7. 可选服务 - SMTP_*, SENTRY_DSN
 * 8. 功能开关 - ENABLE_*, USE_*
 */
export const envSchema = z.object({
  // ========== 应用基础配置 ==========
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  API_HOST: z.string().default('localhost'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  TZ: z.string().default('Asia/Shanghai'),

  // ========== 数据库配置 ==========
  // 完整连接字符串（可选，如果提供则优先使用）
  // 否则应用会从分解式配置自动生成
  DATABASE_URL: z
    .preprocess(emptyStringToUndefined, z.string().url().optional())
    .describe('PostgreSQL 连接字符串（可选，优先使用）'),

  // 分解式配置（用于 docker-compose 等场景）
  // Docker 最佳实践：使用分解配置而非完整 URL
  // 当 DATABASE_URL 未提供时，应用会从这些值自动生成
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('dailyuse'),
  DB_USER: z.string().default('dailyuse'),
  DB_PASSWORD: z.string().default(''),

  // ========== Redis 缓存配置 ==========
  REDIS_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()).describe(
    'Redis 连接字符串 (优先使用)',
  ),

  REDIS_HOST: z.string().default('localhost'),

  REDIS_PORT: z.coerce.number().int().default(6379),

  REDIS_PASSWORD: z.string().optional(),

  REDIS_DB: z.coerce.number().int().default(0),

  // ========== JWT 认证配置 ==========
  JWT_SECRET: z.string().min(32, 'JWT_SECRET 至少需要 32 个字符').describe('JWT 签名密钥'),

  JWT_EXPIRES_IN: z.string().default('7d').describe('JWT Token 有效期'),

  JWT_REFRESH_EXPIRES_IN: z.string().default('30d').describe('JWT 刷新 Token 有效期'),

  REFRESH_TOKEN_SECRET: z
    .preprocess(emptyStringToUndefined, z.string().min(32).optional())
    .describe('刷新 Token 签名密钥 (默认使用 JWT_SECRET)'),

  // ========== CORS 配置 ==========
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .describe('允许的跨域来源，多个用逗号分隔，* 表示全部'),

  // ========== AI 服务配置 ==========
  // OpenAI
  OPENAI_API_KEY: z.string().optional().describe('OpenAI API 密钥'),

  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),

  OPENAI_BASE_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default('https://api.openai.com/v1'),
  ),

  // 七牛云 AI
  QI_NIU_YUN_API_KEY: z.string().optional(),
  QI_NIU_YUN_BASE_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  QI_NIU_YUN_MODEL_ID: z.string().optional(),

  // AI Provider 加密密钥
  AI_PROVIDER_ENCRYPTION_KEY: z
    .preprocess(emptyStringToUndefined, z.string().length(32).optional())
    .describe('AI Provider 配置加密密钥 (32字节)'),

  // ========== 邮件服务配置 ==========
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // ========== 文件上传配置 ==========
  UPLOAD_MAX_SIZE: z.coerce
    .number()
    .default(10485760) // 10MB
    .describe('最大上传文件大小 (字节)'),

  // ========== 监控配置 ==========
  SENTRY_DSN: z.preprocess(emptyStringToUndefined, z.string().url().optional()),

  // ========== 功能开关 ==========
  ENABLE_DAILY_ANALYSIS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  USE_PRIORITY_QUEUE_SCHEDULER: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // ========== PowerSync 同步配置 ==========
  POWERSYNC_URL: z
    .string()
    .optional()
    .describe('PowerSync Service URL (e.g. http://localhost:8080)'),

  POWERSYNC_PRIVATE_KEY: z
    .string()
    .optional()
    .describe('PowerSync RSA private key (PEM, base64 encoded) for signing sync JWTs'),

  POWERSYNC_PUBLIC_KEY_N: z
    .string()
    .optional()
    .describe('PowerSync RSA public key JWK "n" parameter'),

  POWERSYNC_PUBLIC_KEY_E: z
    .string()
    .default('AQAB')
    .describe('PowerSync RSA public key JWK "e" parameter'),

  POWERSYNC_KEY_ID: z.string().default('powersync-key').describe('PowerSync JWKS key ID (kid)'),

  POWERSYNC_SNAPSHOT_DIR: z
    .preprocess(emptyStringToUndefined, z.string().optional())
    .describe('Per-user PowerSync SQLite snapshot root directory'),

  SNAPSHOT_REBUILD_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true')
    .describe('Enable automated snapshot rebuild cron job'),

  SNAPSHOT_REBUILD_SCHEDULE: z
    .string()
    .default('0 */4 * * *')
    .describe('Cron schedule for automated snapshot rebuild'),

  // ========== 构建信息（CI 注入）==========
  BUILD_TIMESTAMP: z.string().optional(),
  GIT_COMMIT: z.string().optional(),
});

/**
 * 环境变量类型
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 处理环境变量的后处理
 * 如果未提供 DATABASE_URL，则从分解式配置自动生成
 *
 * ⚠️ 重要：必须同步设置回 process.env，因为 Prisma 直接读取 process.env.DATABASE_URL
 * ⚠️ 重要：密码中的特殊字符必须 URL 编码
 *
 * @param env 验证后的环境变量对象
 * @returns 处理后的环境变量对象
 */
export function processEnv(env: Env): Env {
  // 如果没有 DATABASE_URL，从分解式配置生成
  if (!env.DATABASE_URL && env.DB_HOST) {
    const username = encodeURIComponent(env.DB_USER || 'dailyuse');
    // ⚠️ 密码必须 URL 编码，否则特殊字符（如 / = @ 等）会破坏 URL 解析
    const password = env.DB_PASSWORD ? `:${encodeURIComponent(env.DB_PASSWORD)}` : '';
    const host = env.DB_HOST;
    const port = env.DB_PORT || 5432;
    const database = encodeURIComponent(env.DB_NAME || 'dailyuse');

    const databaseUrl = `postgresql://${username}${password}@${host}:${port}/${database}?schema=public`;
    env.DATABASE_URL = databaseUrl;

    // ⚠️ 关键：同步设置回 process.env，Prisma 直接读取 process.env.DATABASE_URL
    process.env.DATABASE_URL = databaseUrl;
  }

  // 如果没有 REDIS_URL，从分解式配置生成
  if (!env.REDIS_URL && env.REDIS_HOST) {
    // ⚠️ 密码必须 URL 编码
    const password = env.REDIS_PASSWORD ? `:${encodeURIComponent(env.REDIS_PASSWORD)}` : '';
    const host = env.REDIS_HOST;
    const port = env.REDIS_PORT || 6379;
    const db = env.REDIS_DB || 0;

    const redisUrl = `redis://${password}@${host}:${port}/${db}`;
    env.REDIS_URL = redisUrl;

    // 同步设置回 process.env（如果其他库需要）
    process.env.REDIS_URL = redisUrl;
  }

  return env;
}

/**
 * 部分环境变量类型（用于测试等场景）
 */
export type PartialEnv = Partial<Env>;
