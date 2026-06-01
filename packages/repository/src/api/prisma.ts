/**
 * Repository Prisma Composition Helpers
 *
 * Public-facing convenience factories for composing the repository module
 * with Prisma-backed repositories.
 */

import type { PrismaClient } from '@dailyuse/database';
import {
  createRepositoryModule,
  RepositoryRepositoryFactory,
  ResourceBookmarkPrismaRepository,
  FsStorageAdapter,
  type RepositoryModuleInstance,
  type RepositoryModuleRuntimeContribution,
} from '../infrastructure-server';

export interface CreateRepositoryPrismaModuleOptions {
  readonly storageBaseDir?: string;
  readonly runtimeContributions?:
    | RepositoryModuleRuntimeContribution
    | readonly RepositoryModuleRuntimeContribution[];
}

/**
 * Create a fully-wired repository module backed by Prisma repositories.
 */
export function createRepositoryPrismaModule(
  db: PrismaClient,
  options: CreateRepositoryPrismaModuleOptions = {},
): RepositoryModuleInstance {
  const repositories = RepositoryRepositoryFactory.createPrismaRepositories(db);
  const storageBaseDir =
    options.storageBaseDir ?? process.env.REPOSITORY_STORAGE_PATH ?? '/tmp/dailyuse-repository-storage';

  return createRepositoryModule({
    repositoryRepository: repositories.repositoryRepository,
    resourceRepository: repositories.resourceRepository,
    folderRepository: repositories.folderRepository,
    resourceBookmarkRepository: new ResourceBookmarkPrismaRepository(db),
    storagePort: new FsStorageAdapter(storageBaseDir),
    runtimeContributions: options.runtimeContributions,
  });
}

/**
 * Create a standalone FsStorageAdapter.
 * Needed by desktop AI adapters for file storage operations.
 */
export function createFsStorageAdapter(baseDir?: string): FsStorageAdapter {
  const resolvedBaseDir =
    baseDir ?? process.env.REPOSITORY_STORAGE_PATH ?? '/tmp/dailyuse-repository-storage';
  return new FsStorageAdapter(resolvedBaseDir);
}
