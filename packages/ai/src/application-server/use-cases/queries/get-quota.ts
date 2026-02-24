/**
 * Get Quota Service
 *
 * 获取配额应用服务
 */

import type { IAIUsageQuotaRepository } from '../../../domain-server/repositories/IAIUsageQuotaRepository';
import type { GetQuotaRes } from '@dailyuse/contracts/ai';
import { QuotaResetPeriod } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Get Quota Service
 */
export class GetQuota {
  constructor(private readonly quotaRepository: IAIUsageQuotaRepository) {}

  async execute(identityId: string): Promise<GetQuotaRes> {
    const quota = await this.quotaRepository.findByIdentityId(identityId);

    if (!quota) {
      // 返回默认配额
      const now = Date.now();
      const nextReset = now + 30 * 24 * 60 * 60 * 1000;
      return {
        id: '',
        identityId,
        quotaLimit: 1000,
        currentUsage: 0,
        resetPeriod: QuotaResetPeriod.Monthly,
        lastResetAt: now,
        nextResetAt: nextReset,
        version: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        remainingQuota: 1000,
        usagePercentage: 0,
        isExceeded: false,
        formattedResetPeriod: 'Monthly',
      };
    }

    // 如果 quota 有 toClientDTO 方法则使用，否则直接返回
    return typeof (quota as any).toClientDTO === 'function'
        ? (quota as any).toClientDTO()
        : (quota as any);
  }
}
