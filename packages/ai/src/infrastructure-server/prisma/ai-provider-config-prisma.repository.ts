/**
 * AIProviderConfig Prisma Repository
 *
 * Prisma implementation of IAIProviderConfigRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAIProviderConfigRepository } from '../../ports/ai-provider-config-repository.port';
import type { AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

/**
 * AIProviderConfig Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AIProviderConfigPrismaRepository implements IAIProviderConfigRepository {
  constructor(private readonly prisma: any) {}

  async save(config: AIProviderConfigServerDTO): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string): Promise<AIProviderConfigServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountId(identityId: string): Promise<AIProviderConfigServerDTO[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findDefaultByAccountId(identityId: string): Promise<AIProviderConfigServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityIdAndName(identityId: string, name: string): Promise<AIProviderConfigServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async clearDefaultForAccount(identityId: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
