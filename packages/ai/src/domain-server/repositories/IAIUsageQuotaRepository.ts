/**
 * AI Usage Quota Repository Interface
 * AI 使用配额仓储接口
 *
 * DDD 仓储模式：
 * - 操作领域对象（ServerDTO），不直接操作数据库模型
 * - 由基础设施层实现（Prisma）
 * - 隐藏持久化细节
 */

import type { AIUsageQuotaServerDTO } from '@dailyuse/contracts/ai';

/**
 * IAIUsageQuotaRepository 仓储接口
 *
 * 职责：
 * - AI 使用配额的持久化操作
 * - 按账户查询配额
 * - 更新配额使用情况
 */
export interface IAIUsageQuotaRepository {
  /**
   * 保存配额（创建或更新）
   */
  save(quota: AIUsageQuotaServerDTO): Promise<void>;

  /**
   * 根据 UUID 查找配额
   */
  findByUuid(uuid: string): Promise<AIUsageQuotaServerDTO | null>;

  /**
   * 根据账户 UUID 查找配额（每个账户只有一条配额记录）
   */
  findByAccountUuid(accountUuid: string): Promise<AIUsageQuotaServerDTO | null>;

  /**
   * 创建默认配额（如果不存在）
   */
  createDefaultQuota(accountUuid: string): Promise<AIUsageQuotaServerDTO>;

  /**
   * 删除配额
   */
  delete(uuid: string): Promise<void>;

  /**
   * 检查配额是否存在
   */
  exists(accountUuid: string): Promise<boolean>;
}
