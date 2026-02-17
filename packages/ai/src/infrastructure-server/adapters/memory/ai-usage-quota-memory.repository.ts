/**
 * AIUsageQuota Memory Repository
 *
 * In-memory implementation of IAIUsageQuotaRepository for testing.
 */

import type { IAIUsageQuotaRepository } from '../../../domain-server';
import type { AIUsageQuotaServerDTO, QuotaResetPeriod } from '@dailyuse/contracts/ai';

/**
 * AIUsageQuota Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AIUsageQuotaMemoryRepository implements IAIUsageQuotaRepository {
  private quotas = new Map<string, AIUsageQuotaServerDTO>();
  private accountIndex = new Map<string, string>(); // identityId -> id

  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    this.quotas.set(quota.id, quota);
    this.accountIndex.set(quota.identityId, quota.id);
  }

  async findById(id: string): Promise<AIUsageQuotaServerDTO | null> {
    return this.quotas.get(id) ?? null;
  }

  async findByIdentityId(identityId: string): Promise<AIUsageQuotaServerDTO | null> {
    const id = this.accountIndex.get(identityId);
    return id ? this.quotas.get(id) ?? null : null;
  }

  async findByAccountId(identityId: string): Promise<AIUsageQuotaServerDTO | null> {
    return this.findByIdentityId(identityId);
  }

  async createDefaultQuota(identityId: string): Promise<AIUsageQuotaServerDTO> {
    const id = `quota-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const quota: AIUsageQuotaServerDTO = {
      id,
      identityId,
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

  async delete(id: string): Promise<void> {
    const quota = this.quotas.get(id);
    if (quota) {
      this.accountIndex.delete(quota.identityId);
      this.quotas.delete(id);
    }
  }

  async exists(identityId: string): Promise<boolean> {
    return this.accountIndex.has(identityId);
  }

  // Test helpers
  clear(): void {
    this.quotas.clear();
    this.accountIndex.clear();
  }

  seed(quotas: AIUsageQuotaServerDTO[]): void {
    quotas.forEach((q) => {
      this.quotas.set(q.id, q);
      this.accountIndex.set(q.identityId, q.id);
    });
  }
}
