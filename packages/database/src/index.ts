/**
 * @dailyuse/database — 共享数据库基础设施
 *
 * 提供统一的 PrismaClient 和所有模块的 Model 类型。
 * 这是数据库 Schema 与连接管理的 Single Source of Truth。
 *
 * @example
 * ```typescript
 * // 获取单例连接
 * import { prisma } from '@dailyuse/database';
 *
 * // 使用 PrismaClient 类型（用于 DI）
 * import type { PrismaClient } from '@dailyuse/database';
 *
 * // 使用 Model 类型
 * import type { Rule, RuleRevision } from '@dailyuse/database';
 * ```
 */

// PrismaClient 类 & 生成的 Model 类型
export * from './generated/prisma/client.js';

// 单例实例 & 生命周期管理
export { prisma, connectDatabase, disconnectDatabase } from './client.js';

// PowerSync 客户端 Schema（Desktop 和 Web 共用）
export { PowerSyncAppSchema } from './powersync-schema.js';

// Mapper 辅助函数（日期解析、JSON 解析、SQL 转义）
export {
  extractErrorMessage,
  withCause,
  fromDbDate,
  toDate,
  toDateOrNull,
  parseJson,
  parseStringArray,
  parseRecord,
  escapeSqlLike,
} from './mapper-helpers.js';
