/**
 * Get Quota Service
 *
 * 获取配额应用服务
 */

import type { IAIUsageQuotaRepository } from '../../../domain-server/repositories/IAIUsageQuotaRepository';
import type { GetQuotaRes } from '@dailyuse/contracts/ai';
// import { AIContainer } from '@dailyuse/ai/infrastructure-server';

/**
 * Get Quota Service
 */
export class GetQuota {
  constructor(private readonly quotaRepository: IAIUsageQuotaRepository) {}

  async execute(identityId: string): Promise<GetQuotaRes> {
    let quota = await this.quotaRepository.findByIdentityId(identityId);

    if (!quota) {
      // 默认创建配额
      quota = await this.quotaRepository.createDefaultQuota(identityId);
    }

    // Convert ServerDTO to ClientDTO/Res
    // Assuming GetQuotaRes is compatible with what we return or needs mapping
    // Based on error: Type 'AIUsageQuotaServerDTO' is missing properties from type 'AIUsageQuotaClientDTO'
    // And 'daysUntilReset' does not exist in type 'AIUsageQuotaClientDTO'

    // const now = Date.now();

    return {
      id: String(quota.id),
      identityId: String(quota.identityId),
      quotaLimit: quota.quotaLimit,
      currentUsage: quota.currentUsage,
      resetPeriod: quota.resetPeriod,
      lastResetAt: quota.lastResetAt,
      nextResetAt: quota.nextResetAt,
      version: 1, // Default version
      createdAt: quota.createdAt,
      updatedAt: quota.updatedAt,
      deletedAt: null,
      remainingQuota: Math.max(0, quota.quotaLimit - quota.currentUsage),
      usagePercentage: quota.quotaLimit > 0 ? (quota.currentUsage / quota.quotaLimit) * 100 : 0,
      isExceeded: quota.currentUsage >= quota.quotaLimit,
      // daysUntilReset: Math.ceil((quota.nextResetAt - now) / (1000 * 60 * 60 * 24)), // Removed as it is not in DTO
      formattedResetPeriod: quota.resetPeriod, // Mapping formattedResetPeriod
    };
  }
}
