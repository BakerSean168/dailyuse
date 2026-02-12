/**
 * AppConfig Prisma Repository
 *
 * Prisma implementation of IAppConfigRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAppConfigRepository } from '../../ports/app-config-repository.port';

/**
 * AppConfig Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AppConfigPrismaRepository implements IAppConfigRepository {
  constructor(private readonly prisma: any) {}

  async save(config: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(uuid: string): Promise<any | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async getCurrent(): Promise<any | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByVersion(version: string): Promise<any | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findAllVersions(): Promise<any[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsByVersion(version: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
