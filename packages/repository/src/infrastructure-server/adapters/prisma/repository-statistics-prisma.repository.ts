/**
 * RepositoryStatistics Prisma Repository
 *
 * Prisma implementation of IRepositoryStatisticsRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IRepositoryStatisticsRepository } from '../../ports/repository-statistics-repository.port';
import type { RepositoryStatistics } from '../../../domain-server/aggregates/repository-statistics';

/**
 * RepositoryStatistics Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class RepositoryStatisticsPrismaRepository implements IRepositoryStatisticsRepository {
  constructor(private readonly prisma: any) {}

  async save(statistics: RepositoryStatistics): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityId(identityId: string): Promise<RepositoryStatistics | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string): Promise<RepositoryStatistics | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityIds(identityIds: string[]): Promise<RepositoryStatistics[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async count(): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
