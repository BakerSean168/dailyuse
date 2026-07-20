/**
 * @file env.ts
 * @description 环境变量统一加载和验证模块
 *
 * 加载优先级（后面覆盖前面）：
 * 1. .env                    - 共享默认值
 * 2. .env.{NODE_ENV}         - 环境特定配置
 * 3. .env.local              - 本地覆盖（.gitignore）
 * 4. .env.{NODE_ENV}.local   - 环境特定本地覆盖（.gitignore）
 *
 * @date 2025-12-22
 */

import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { envSchema, processEnv, type Env } from './env.schema.js';
import { ZodError } from 'zod';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root (from apps/api/src/shared/infrastructure/config up 6 levels)
const PROJECT_ROOT = resolve(__dirname, '../../../../../../');

/**
 * 加载 .env 文件
 * @param filePath 文件路径
 * @param override 是否覆盖已有环境变量
 */
function loadEnvFile(filePath: string, override = true): void {
  if (existsSync(filePath)) {
    expand(config({ path: filePath, override }));
  }
}

/**
 * 按优先级加载所有 .env 文件
 */
function loadAllEnvFiles(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Load order (low to high priority)
  const envFiles = [
    // Workspace root (centralized env files)
    resolve(PROJECT_ROOT, '.env'),
    resolve(PROJECT_ROOT, `.env.${nodeEnv}`),
    resolve(PROJECT_ROOT, '.env.local'),
    resolve(PROJECT_ROOT, `.env.${nodeEnv}.local`),
  ];

  // 按顺序加载，后面的覆盖前面的
  envFiles.forEach((file) => loadEnvFile(file, true));
}

/**
 * 格式化 Zod 验证错误
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `  - ${path}: ${issue.message}`;
  });

  return `环境变量验证失败:\n${issues.join('\n')}`;
}

/**
 * 验证并返回环境变量
 */
function validateEnv(): Env {
  // 先加载所有 .env 文件
  loadAllEnvFiles();

  try {
    // 使用 Zod Schema 验证
    let env = envSchema.parse(process.env);

    // 后处理：如果未提供 DATABASE_URL，从分解式配置生成
    env = processEnv(env);

    return env;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('\n' + '='.repeat(60));
      console.error('🚨 环境变量配置错误');
      console.error('='.repeat(60));
      console.error(formatZodError(error));
      console.error('='.repeat(60));
      console.error('\n请检查 .env 文件配置是否正确\n');
      console.error('参考: .env.example 或 .env.development\n');

      // 在非测试环境下退出
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }
    throw error;
  }
}

/**
 * 已验证的环境变量单例
 * 应用启动时加载一次，后续直接使用
 */
export const env: Env = validateEnv();

/**
 * 判断是否为开发环境
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * 判断是否为生产环境
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * 判断是否为测试环境
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * 获取 Redis 连接配置
 * 优先使用 REDIS_URL，否则使用分解配置
 */
export function getRedisConfig() {
  if (env.REDIS_URL) {
    return { url: env.REDIS_URL };
  }

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  };
}

/**
 * 获取 CORS 允许的来源列表
 */
export function getCorsOrigins(): string[] {
  return env.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 判断是否允许所有跨域来源
 */
export function isAllCorsOriginsAllowed(): boolean {
  return getCorsOrigins().includes('*');
}

/**
 * 获取 JWT 配置
 */
export function getJwtConfig() {
  return {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    refreshSecret: env.REFRESH_TOKEN_SECRET || env.JWT_SECRET,
  };
}

/**
 * 获取 GitHub OAuth 登录配置（可选）。
 * Returns null when GitHub login is not configured, so the composition root
 * can skip registering the GitHub provider entirely.
 * 未配置时返回 null，组合根据此跳过注册 GitHub 提供者。
 */
export function getGithubOAuthConfig(): { clientId: string; clientSecret: string } | null {
  if (env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET) {
    return {
      clientId: env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET,
    };
  }
  // E2E / test lanes get a deterministic mock provider so OAuth product flows are exercisable.
  // e2e / test 车道注入确定性 mock 提供者，便于演练 OAuth 产品流。
  if (env.RUNTIME_LANE === 'e2e' || env.NODE_ENV === 'test') {
    return {
      clientId: 'e2e-mock',
      clientSecret: 'e2e-mock-secret',
    };
  }
  return null;
}

export interface GithubAppConfig {
  appId: string;
  appSlug: string;
  privateKey: string;
  webhookSecret: string;
}

/**
 * GitHub App configuration for knowledge repository authorization.
 * A partial configuration is rejected so the runtime cannot expose a flow
 * that later fails at token issuance or webhook verification.
 */
export function getGithubAppConfig(): GithubAppConfig | null {
  const values = [
    env.GITHUB_APP_ID,
    env.GITHUB_APP_SLUG,
    env.GITHUB_APP_PRIVATE_KEY,
    env.GITHUB_APP_WEBHOOK_SECRET,
  ];
  if (values.every((value) => value === undefined)) {
    return null;
  }
  if (values.some((value) => value === undefined)) {
    throw new Error(
      'GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY and GITHUB_APP_WEBHOOK_SECRET must be configured together',
    );
  }
  return {
    appId: env.GITHUB_APP_ID!,
    appSlug: env.GITHUB_APP_SLUG!,
    privateKey: env.GITHUB_APP_PRIVATE_KEY!,
    webhookSecret: env.GITHUB_APP_WEBHOOK_SECRET!,
  };
}

/**
 * 获取 PowerSync 配置
 */
export function getPowerSyncConfig() {
  return {
    url: env.POWERSYNC_URL,
    privateKey: env.POWERSYNC_PRIVATE_KEY
      ? Buffer.from(env.POWERSYNC_PRIVATE_KEY, 'base64').toString('utf-8')
      : undefined,
    publicKeyN: env.POWERSYNC_PUBLIC_KEY_N,
    publicKeyE: env.POWERSYNC_PUBLIC_KEY_E,
    keyId: env.POWERSYNC_KEY_ID,
    snapshotDir: env.POWERSYNC_SNAPSHOT_DIR,
  };
}

// 导出 schema 供测试使用
export { envSchema } from './env.schema.js';
export type { Env, PartialEnv } from './env.schema.js';
