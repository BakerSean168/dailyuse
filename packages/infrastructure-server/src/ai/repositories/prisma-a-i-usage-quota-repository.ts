// @ts-nocheck
/**
 * Prisma AI Usage Quota Repository
 * Prisma AI 使用配额仓储实现
 *
 * 职责：
 * - 操作 ai_usage_quotas 表
 * - ServerDTO ↔ Prisma Model 映射
 * - 每个账户只有一条配额记录（accountUuid 唯一）
 *
 * TODO: 需要数据库 migration 应用后修复类型错误
 */

import { PrismaClient } from '@prisma/client';
import type { IAIUsageQuotaRepository } from '@dailyuse/domain-server/ai';
import type { AIUsageQuotaServerDTO } from '@dailyuse/contracts/ai';
import { QuotaResetPeriod } from '@dailyuse/contracts/ai';

/**
 * PrismaAIUsageQuotaRepository 实现
 */
export class PrismaAIUsageQuotaRepository implements IAIUsageQuotaRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 保存配额（UPSERT 语义）
   */
  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    await this.prisma.aiUsageQuota.upsert({
      where: { uuid: quota.uuid },
      create: {
        uuid: quota.uuid,
        accountUuid: quota.accountUuid,
        quotaLimit: quota.quotaLimit,
        currentUsage: quota.currentUsage,
        resetPeriod: quota.resetPeriod,
        lastResetAt: new Date(quota.lastResetAt),
        nextResetAt: new Date(quota.nextResetAt),
        createdAt: new Date(quota.createdAt),
        updatedAt: new Date(quota.updatedAt),
      },
      update: {
        quotaLimit: quota.quotaLimit,
        currentUsage: quota.currentUsage,
        resetPeriod: quota.resetPeriod,
        lastResetAt: new Date(quota.lastResetAt),
        nextResetAt: new Date(quota.nextResetAt),
        updatedAt: new Date(quota.updatedAt),
      },
    });
  }

  /**
   * 根据 UUID 查找配额
   */
  async findByUuid(uuid: string): Promise<AIUsageQuotaServerDTO | null> {
    const record = await this.prisma.aiUsageQuota.findUnique({
      where: { uuid },
    });

    return record ? this.toServerDTO(record) : null;
  }

  /**
   * 根据账户 UUID 查找配额
   */
  async findByAccountUuid(accountUuid: string): Promise<AIUsageQuotaServerDTO | null> {
    const record = await this.prisma.aiUsageQuota.findUnique({
      where: { accountUuid },
    });

    return record ? this.toServerDTO(record) : null;
  }

  /**
   * 创建默认配额
   */
  async createDefaultQuota(accountUuid: string): Promise<AIUsageQuotaServerDTO> {
    const now = Date.now();
    const nextReset = now + 24 * 60 * 60 * 1000; // 24小时后

    const record = await this.prisma.aiUsageQuota.create({
      data: {
        accountUuid,
        quotaLimit: 50, // 默认每日 50 次
        currentUsage: 0,
        resetPeriod: 'DAILY',
        lastResetAt: new Date(now),
        nextResetAt: new Date(nextReset),
      },
    });

    return this.toServerDTO(record);
  }

  /**
   * 删除配额
   */
  async delete(uuid: string): Promise<void> {
    await this.prisma.aiUsageQuota.delete({
      where: { uuid },
    });
  }

  /**
   * 检查配额是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.aiUsageQuota.count({
      where: { accountUuid },
    });
    return count > 0;
  }

  /**
   * 映射：Prisma Model → ServerDTO
   */
  private toServerDTO(record: any): AIUsageQuotaServerDTO {
    // 映射数据库字符串 → QuotaResetPeriod 枚举
    let resetPeriod: QuotaResetPeriod;
    switch (record.resetPeriod) {
      case 'DAILY':
        resetPeriod = QuotaResetPeriod.DAILY;
        break;
      case 'WEEKLY':
        resetPeriod = QuotaResetPeriod.WEEKLY;
        break;
      case 'MONTHLY':
        resetPeriod = QuotaResetPeriod.MONTHLY;
        break;
      default:
        resetPeriod = QuotaResetPeriod.DAILY;
    }

    return {
      uuid: record.uuid,
      accountUuid: record.accountUuid,
      quotaLimit: record.quotaLimit,
      currentUsage: record.currentUsage,
      resetPeriod,
      lastResetAt: record.lastResetAt.getTime(),
      nextResetAt: record.nextResetAt.getTime(),
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    };
  }
}




