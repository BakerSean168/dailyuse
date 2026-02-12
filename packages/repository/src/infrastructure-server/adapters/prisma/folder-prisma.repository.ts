/**
 * Folder Prisma Repository
 *
 * Prisma implementation of IFolderRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IFolderRepository } from '../../ports/folder-repository.port';
import type { Folder } from '../../../domain-server/entities/folder';

/**
 * Folder Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class FolderPrismaRepository implements IFolderRepository {
  constructor(private readonly prisma: any) {}

  async save(folder: Folder): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByUuid(uuid: string): Promise<Folder | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByParentUuid(parentUuid: string): Promise<Folder[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findRootFolders(repositoryUuid: string): Promise<Folder[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async deleteByRepositoryUuid(repositoryUuid: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
