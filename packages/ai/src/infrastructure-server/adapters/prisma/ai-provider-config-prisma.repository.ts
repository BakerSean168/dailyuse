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

  async findByUuid(uuid: string): Promise<AIProviderConfigServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findDefaultByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuidAndName(accountUuid: string, name: string): Promise<AIProviderConfigServerDTO | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async clearDefaultForAccount(accountUuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
