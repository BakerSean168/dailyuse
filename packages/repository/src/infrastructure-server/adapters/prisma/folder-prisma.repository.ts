/**
 * Folder Prisma Repository
 *
 * Prisma implementation of IFolderRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IFolderRepository } from '../../../domain-server/repositories/IFolderRepository';
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

  async findById(id: string): Promise<Folder | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByRepositoryId(repositoryId: string): Promise<Folder[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByParentId(parentId: string): Promise<Folder[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findRootFolders(repositoryId: string): Promise<Folder[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async exists(id: string): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
