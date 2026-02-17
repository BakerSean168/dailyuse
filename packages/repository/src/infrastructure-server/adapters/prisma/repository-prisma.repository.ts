/**
 * Repository Prisma Repository
 *
 * Prisma implementation of IRepositoryRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import type { Repository } from '../../../domain-server/aggregates/repository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';

/**
 * Repository Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class RepositoryPrismaRepository implements IRepositoryRepository {
  constructor(private readonly prisma: any) {}

  async save(repository: Repository): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string): Promise<Repository | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityIdAndStatus(identityId: string, status: RepositoryStatus): Promise<Repository[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
