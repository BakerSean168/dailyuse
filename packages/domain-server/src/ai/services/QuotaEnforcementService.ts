/**
 * Quota Enforcement Service
 *
 * Domain service responsible for managing and enforcing AI usage quotas.
 * Handles quota checks, consumption, and reset operations.
 */

import { QuotaResetPeriod } from '@dailyuse/contracts/ai';
import type { IAIUsageQuotaRepository } from '../repositories/IAIUsageQuotaRepository';
import { AIUsageQuotaServer } from '../aggregates/AIUsageQuotaServer';


export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public readonly accountUuid: string,
    public readonly currentUsage: number,
    public readonly quotaLimit: number,
  ) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class QuotaNotFoundError extends Error {
  constructor(
    message: string,
    public readonly accountUuid: string,
  ) {
    super(message);
    this.name = 'QuotaNotFoundError';
  }
}

export interface QuotaCheckResult {
  allowed: boolean;
  remainingQuota: number;
  quotaLimit: number;
  currentUsage: number;
  nextResetAt: number;
  reason?: string;
}

export class QuotaEnforcementService {
  constructor(private readonly quotaRepository: IAIUsageQuotaRepository) {}

  /**
   * Check if the user has sufficient quota for the requested amount
   */
  async checkQuota(accountUuid: string, requestedAmount: number = 1): Promise<QuotaCheckResult> {
    const quota = await this.getOrCreateQuota(accountUuid);

    // Auto-reset if needed
    if (quota.shouldReset()) {
      quota.reset();
      await this.quotaRepository.save(quota.toServerDTO());
    }

    const canConsume = quota.canConsume(requestedAmount);
    const remainingQuota = quota.getRemainingQuota();

    return {
      allowed: canConsume,
      remainingQuota,
      quotaLimit: quota.quotaLimit,
      currentUsage: quota.currentUsage,
      nextResetAt: quota.nextResetAt.getTime(),
      reason: canConsume ? undefined : 'Insufficient quota available',
    };
  }

  /**
   * Consume quota for a successful generation
   * @throws QuotaExceededError if quota is insufficient
   */
  async consumeQuota(accountUuid: string, tokensUsed: number): Promise<void> {
    const quota = await this.getOrCreateQuota(accountUuid);

    // Auto-reset if needed
    if (quota.shouldReset()) {
      quota.reset();
    }

    const consumed = quota.consume(tokensUsed);

    if (!consumed) {
      throw new QuotaExceededError(
        `Quota exceeded for account ${accountUuid}. Current: ${quota.currentUsage}, Limit: ${quota.quotaLimit}, Requested: ${tokensUsed}`,
        accountUuid,
        quota.currentUsage,
        quota.quotaLimit,
      );
    }

    await this.quotaRepository.save(quota.toServerDTO());
  }

  /**
   * Manually reset quota for an account
   */
  async resetQuota(accountUuid: string): Promise<void> {
    const quota = await this.getOrCreateQuota(accountUuid);
    quota.reset();
    await this.quotaRepository.save(quota.toServerDTO());
  }

  /**
   * Get current quota status for an account
   */
  async getQuotaStatus(accountUuid: string): Promise<{
    remainingQuota: number;
    quotaLimit: number;
    currentUsage: number;
    usagePercentage: number;
    nextResetAt: number;
    isExceeded: boolean;
  }> {
    const quota = await this.getOrCreateQuota(accountUuid);

    // Auto-reset if needed
    if (quota.shouldReset()) {
      quota.reset();
      await this.quotaRepository.save(quota.toServerDTO());
    }

    return {
      remainingQuota: quota.getRemainingQuota(),
      quotaLimit: quota.quotaLimit,
      currentUsage: quota.currentUsage,
      usagePercentage: quota.getUsagePercentage(),
      nextResetAt: quota.nextResetAt.getTime(),
      isExceeded: quota.isExceeded(),
    };
  }

  /**
   * Update quota limit for an account
   */
  async updateQuotaLimit(accountUuid: string, newLimit: number): Promise<void> {
    const quota = await this.getOrCreateQuota(accountUuid);
    quota.updateLimit(newLimit);
    await this.quotaRepository.save(quota.toServerDTO());
  }

  /**
   * Get or create a default quota for an account
   * Private helper method
   */
  private async getOrCreateQuota(accountUuid: string): Promise<AIUsageQuotaServer> {
    const quotaDTO = await this.quotaRepository.findByAccountUuid(accountUuid);

    if (!quotaDTO) {
      // Create default quota: 50 requests per day
      const quota = AIUsageQuotaServer.create({
        accountUuid,
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriod.DAILY,
      });
      await this.quotaRepository.save(quota.toServerDTO());
      return quota;
    }

    return AIUsageQuotaServer.fromServerDTO(quotaDTO);
  }

  /**
   * Check if scheduled reset is needed for all quotas
   * This can be called by a scheduled job
   */
  async processScheduledResets(): Promise<number> {
    // Note: This would need a findAll method on the repository
    // For now, this is a placeholder for the reset logic
    // In production, you'd iterate through all quotas and reset those that need it
    return 0;
  }
}
