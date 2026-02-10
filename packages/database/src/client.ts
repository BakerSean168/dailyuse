/**
 * @file Database Client Singleton
 * @description 管理共享的 PrismaClient 实例，防止热重载时连接池泄漏。
 *
 * 所有模块应通过本模块获取数据库连接，而不是自行创建 PrismaClient。
 */

import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var __dailyuse_prisma: PrismaClient | undefined;
}

/**
 * 共享 PrismaClient 单例。
 *
 * ✅ Prisma 7 使用 adapter 模式连接数据库
 * 开发环境下挂载到 globalThis 以防热重载创建多个连接。
 */
export const prisma: PrismaClient = (() => {
  if (globalThis.__dailyuse_prisma) {
    return globalThis.__dailyuse_prisma;
  }

  // ✅ 直接传 connectionString 给 adapter（Prisma 7 推荐方式）
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  // 创建 PrismaClient
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__dailyuse_prisma = client;
  }

  return client;
})();

/**
 * 显式连接数据库（Prisma 默认懒连接）。
 */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

/**
 * 断开数据库连接，用于优雅关闭。
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
