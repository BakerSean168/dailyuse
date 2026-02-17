/**
 * Quota Enforcement Service
 *
 * Domain service responsible for managing and enforcing AI usage quotas.
 * Handles quota checks, consumption, and reset operations.
 */

import { QuotaResetPeriod } from '@dailyuse/contracts/ai';
import type { IAIUsageQuotaRepository } from '../repositories/IAIUsageQuotaRepository';
import { AIUsageQuota } from '../aggregates/ai-usage-quota';


export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public readonly identityId: string,
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
    public readonly identityId: string,
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
  async checkQuota(identityId: string, requestedAmount: number = 1): Promise<QuotaCheckResult> {
    const quota = await this.getOrCreateQuota(identityId);

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
      nextResetAt: quota.nextResetAt as unknown as number,
      reason: canConsume ? undefined : 'Insufficient quota available',
    };
  }

  /**
   * Consume quota for a successful generation
   * @throws QuotaExceededError if quota is insufficient
   */
  async consumeQuota(identityId: string, tokensUsed: number): Promise<void> {
    const quota = await this.getOrCreateQuota(identityId);

    // Auto-reset if needed
    if (quota.shouldReset()) {
      quota.reset();
    }

    const consumed = quota.consume(tokensUsed);

    if (!consumed) {
      throw new QuotaExceededError(
        `Quota exceeded for account ${identityId}. Current: ${quota.currentUsage}, Limit: ${quota.quotaLimit}, Requested: ${tokensUsed}`,
        identityId,
        quota.currentUsage,
        quota.quotaLimit,
      );
    }

    await this.quotaRepository.save(quota.toServerDTO());
  }

  /**
   * Manually reset quota for an account
   */
  async resetQuota(identityId: string): Promise<void> {
    const quota = await this.getOrCreateQuota(identityId);
    quota.reset();
    await this.quotaRepository.save(quota.toServerDTO());
  }

  /**
   * Get current quota status for an account
   */
  async getQuotaStatus(identityId: string): Promise<{
    remainingQuota: number;
    quotaLimit: number;
    currentUsage: number;
    usagePercentage: number;
    nextResetAt: number;
    isExceeded: boolean;
  }> {
    const quota = await this.getOrCreateQuota(identityId);

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
      nextResetAt: quota.nextResetAt as unknown as number,
      isExceeded: quota.isExceeded(),
    };
  }

  /**
   * Update quota limit for an account
   */
  async updateQuotaLimit(identityId: string, newLimit: number): Promise<void> {
    const quota = await this.getOrCreateQuota(identityId);
    quota.updateLimit(newLimit);
    await this.quotaRepository.save(quota.toServerDTO());
  }

  /**
   * Get or create a default quota for an account
   * Private helper method
   */
  private async getOrCreateQuota(identityId: string): Promise<AIUsageQuota> {
    const quotaDTO = await this.quotaRepository.findByIdentityId(identityId);

    if (!quotaDTO) {
      // Create default quota: 50 requests per day
      const quota = AIUsageQuota.create({
        identityId: identityId,
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriod.Daily,
      });
      await this.quotaRepository.save(quota.toServerDTO());
      return quota;
    }

    return AIUsageQuota.fromServerDTO(quotaDTO);
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
