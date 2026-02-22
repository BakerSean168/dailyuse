/**
 * Resource Prisma Repository
 *
 * Prisma implementation of IResourceRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';
import type { Resource } from '../../../domain-server/entities/resource';

/**
 * Resource Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class ResourcePrismaRepository implements IResourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(resource: Resource): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(id: string): Promise<Resource | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsByPath(repositoryId: string, path: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
