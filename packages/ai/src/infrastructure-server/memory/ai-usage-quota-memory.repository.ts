/**
 * AIUsageQuota Memory Repository
 *
 * In-memory implementation of IAIUsageQuotaRepository for testing.
 */

import type { IAIUsageQuotaRepository } from '../../ports/ai-usage-quota-repository.port';
import type { AIUsageQuotaServerDTO, QuotaResetPeriod } from '@dailyuse/contracts/ai';

/**
 * AIUsageQuota Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIUsageQuotaMemoryRepository implements IAIUsageQuotaRepository {
  private quotas = new Map<string, AIUsageQuotaServerDTO>();
  private accountIndex = new Map<string, string>(); // accountUuid -> uuid

  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    this.quotas.set(quota.uuid, quota);
    this.accountIndex.set(quota.accountUuid, quota.uuid);
  }

  async findByUuid(uuid: string): Promise<AIUsageQuotaServerDTO | null> {
    return this.quotas.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string): Promise<AIUsageQuotaServerDTO | null> {
    const uuid = this.accountIndex.get(accountUuid);
    return uuid ? this.quotas.get(uuid) ?? null : null;
  }

  async createDefaultQuota(accountUuid: string): Promise<AIUsageQuotaServerDTO> {
    const uuid = `quota-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const quota: AIUsageQuotaServerDTO = {
      uuid,
      accountUuid,
      quotaLimit: 100000,
      currentUsage: 0,
      resetPeriod: 'DAILY' as QuotaResetPeriod,
      lastResetAt: now,
      nextResetAt: now + 24 * 60 * 60 * 1000,
      createdAt: now,
      updatedAt: now,
    };
    await this.save(quota);
    return quota;
  }

  async delete(uuid: string): Promise<void> {
    const quota = this.quotas.get(uuid);
    if (quota) {
      this.accountIndex.delete(quota.accountUuid);
      this.quotas.delete(uuid);
    }
  }

  async exists(accountUuid: string): Promise<boolean> {
    return this.accountIndex.has(accountUuid);
  }

  // Test helpers
  clear(): void {
    this.quotas.clear();
    this.accountIndex.clear();
  }

  seed(quotas: AIUsageQuotaServerDTO[]): void {
    quotas.forEach((q) => {
      this.quotas.set(q.uuid, q);
      this.accountIndex.set(q.accountUuid, q.uuid);
    });
  }
}
