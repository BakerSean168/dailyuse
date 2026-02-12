/**
 * Get Quota Service
 *
 * 获取配额应用服务
 */

import type { IAIUsageQuotaRepository } from '../../domain-server/repositories/IAIUsageQuotaRepository';
import type { QuotaResponse } from '@dailyuse/contracts/ai';
import { QuotaResetPeriod } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Get Quota Service
 */
export class GetQuota {
  constructor(private readonly quotaRepository: IAIUsageQuotaRepository) {}

  async execute(accountUuid: string): Promise<QuotaResponse> {
    const quota = await this.quotaRepository.findByAccountUuid(accountUuid);

    if (!quota) {
      // 返回默认配额
      const now = Date.now();
      const nextReset = now + 30 * 24 * 60 * 60 * 1000;
      return {
        quota: {
          uuid: '',
          accountUuid,
          quotaLimit: 1000,
          currentUsage: 0,
          resetPeriod: QuotaResetPeriod.MONTHLY,
          lastResetAt: now,
          nextResetAt: nextReset,
          createdAt: now,
          updatedAt: now,
          remainingQuota: 1000,
          usagePercentage: 0,
          isExceeded: false,
          formattedResetPeriod: 'Monthly',
        },
      };
    }

    // 如果 quota �?toClientDTO 方法则使用，否则直接返回
    const quotaDTO =
      typeof (quota as any).toClientDTO === 'function'
        ? (quota as any).toClientDTO()
        : (quota as any);

    return {
      quota: quotaDTO,
    };
  }
}
