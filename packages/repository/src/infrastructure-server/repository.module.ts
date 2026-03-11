/**
 * Repository Module
 *
 * DI Container for Repository domain.
 * Supports both Prisma (API) and PowerSync (Desktop) data sources.
 *
 * Usage:
 * ```typescript
 * // API (Prisma)
 * const repositoryModule = new RepositoryModule('prisma', prismaClient);
 *
 * // Desktop (PowerSync)
 * const repositoryModule = new RepositoryModule('powersync', powersyncDb);
 * ```
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

import type { IRepositoryRepository } from '../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../domain-server/repositories/IFolderRepository';
import type { IResourceBookmarkRepository } from '../domain-server/repositories/IResourceBookmarkRepository';

import { RepositorySyncApplicationService } from '../application-server/use-cases/commands/repository-sync-application-service';

import { RepositoryRepositoryFactory } from './di/repository-repository.factory';
import { RepositoryContainer } from './di/repository-container-v2';
import { ResourceBookmarkPrismaRepository } from './adapters/prisma/resource-bookmark-prisma.repository';
import { ResourceBookmarkPowerSyncRepository } from './adapters/powersync/resource-bookmark-powersync.repository';

export class RepositoryModule {
  // ============ Repositories (Public for testing) ============
  public readonly repositoryRepository: IRepositoryRepository;
  public readonly resourceRepository: IResourceRepository;
  public readonly folderRepository: IFolderRepository;
  public readonly resourceBookmarkRepository: IResourceBookmarkRepository;

  // ============ Application Services (Public - injected into routes) ============
  public readonly syncService: RepositorySyncApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'powersync',
    dbConnection: PrismaClient | IElectronDatabase,
  ) {
    // ============ Step 1: Initialize Repositories using Factory ============
    const repositories = RepositoryRepositoryFactory.create(dataSourceType, dbConnection);

    const container = RepositoryContainer.getInstance();
    container.reset();
    container.registerRepositoryRepository(repositories.repositoryRepository);
    container.registerResourceRepository(repositories.resourceRepository);
    container.registerFolderRepository(repositories.folderRepository);

    this.repositoryRepository = container.getRepositoryRepository();
    this.resourceRepository = container.getResourceRepository();
    this.folderRepository = container.getFolderRepository();
    this.resourceBookmarkRepository =
      dataSourceType === 'prisma'
        ? new ResourceBookmarkPrismaRepository(dbConnection as PrismaClient)
        : new ResourceBookmarkPowerSyncRepository(dbConnection as IElectronDatabase);

    // ============ Step 2: Initialize Application Services (Pure DI) ============
    this.syncService = new RepositorySyncApplicationService();
  }
}
