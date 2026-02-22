/**
 * AppConfig Prisma Repository
 *
 * Prisma implementation of IAppConfigRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IAppConfigRepository } from '@/domain-server';

/**
 * AppConfig Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AppConfigPrismaRepository implements IAppConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(config: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string): Promise<any | null> {
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

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsByVersion(version: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
