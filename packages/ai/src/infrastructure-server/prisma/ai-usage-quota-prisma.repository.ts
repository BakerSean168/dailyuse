/**
 * AIUsageQuota Prisma Repository
 *
 * Prisma implementation of IAIUsageQuotaRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAIUsageQuotaRepository } from '../../ports/ai-usage-quota-repository.port';
import type { AIUsageQuotaServerDTO } from '@dailyuse/contracts/ai';

/**
 * AIUsageQuota Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AIUsageQuotaPrismaRepository implements IAIUsageQuotaRepository {
  constructor(private readonly prisma: any) {}

  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string): Promise<AIUsageQuotaServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountId(identityId: string): Promise<AIUsageQuotaServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async createDefaultQuota(identityId: string): Promise<AIUsageQuotaServerDTO> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(identityId: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
