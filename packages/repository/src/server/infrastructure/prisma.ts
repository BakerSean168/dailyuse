/**
 * Repository Prisma composition helpers.
 */

import type { PrismaClient } from '@dailyuse/database';
import { RepositoryRepositoryFactory } from './di/repository-repository.factory';
import { ResourceBookmarkPrismaRepository } from './adapters/prisma/resource-bookmark-prisma.repository';
import { FsStorageAdapter } from './adapters/fs/fs-storage.adapter';
import {
  createRepositoryModule,
  type RepositoryModuleInstance,
  type RepositoryModuleRuntimeContribution,
} from './repository.module';
import { resolveRepositoryStorageBaseDir } from './storage-config';

export interface CreateRepositoryPrismaModuleOptions {
  readonly storageBaseDir?: string;
  readonly runtimeContributions?:
    | RepositoryModuleRuntimeContribution
    | readonly RepositoryModuleRuntimeContribution[];
}

export function createFsStorageAdapter(baseDir?: string): FsStorageAdapter {
  const resolvedBaseDir = resolveRepositoryStorageBaseDir({ storageBaseDir: baseDir });
  return new FsStorageAdapter(resolvedBaseDir);
}

export function createRepositoryPrismaModule(
  db: PrismaClient,
  options: CreateRepositoryPrismaModuleOptions = {},
): RepositoryModuleInstance {
  const repositories = RepositoryRepositoryFactory.createPrismaRepositories(db);
  const storagePort = createFsStorageAdapter(options.storageBaseDir);

  return createRepositoryModule({
    repositoryRepository: repositories.repositoryRepository,
    resourceRepository: repositories.resourceRepository,
    folderRepository: repositories.folderRepository,
    resourceBookmarkRepository: new ResourceBookmarkPrismaRepository(db),
    storagePort,
    runtimeContributions: options.runtimeContributions,
  });
}
