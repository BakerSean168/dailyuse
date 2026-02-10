/**
 * Resource Prisma Repository
 *
 * Prisma implementation of IResourceRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IResourceRepository } from '../../ports/resource-repository.port';
import type { Resource } from '@/domain-server';

/**
 * Resource Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class ResourcePrismaRepository implements IResourceRepository {
  constructor(private readonly prisma: any) {}

  async save(resource: Resource): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByUuid(uuid: string): Promise<Resource | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findById(uuid: string): Promise<Resource | null> {
    return this.findByUuid(uuid);
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByFolderUuid(folderUuid: string): Promise<Resource[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(accountUuid: string): Promise<Resource[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
