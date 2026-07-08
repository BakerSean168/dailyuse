/**
 * Repository Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IRepositoryRepository } from '../../domain/repositories/i-repository-repository';
import type { IResourceRepository } from '../../domain/repositories/i-resource-repository';
import type { IFolderRepository } from '../../domain/repositories/i-folder-repository';

import {
  RepositoryPrismaRepository,
  ResourcePrismaRepository,
  FolderPrismaRepository,
} from '../adapters/prisma';

import {
  PowerSyncRepositoryRepository,
  PowerSyncResourceRepository,
  PowerSyncFolderRepository,
} from '../adapters/powersync';

/**
 * Repository Repository Factory
 */
interface RepositoryImplementations {
  repositoryRepository: IRepositoryRepository;
  resourceRepository: IResourceRepository;
  folderRepository: IFolderRepository;
}

export class RepositoryRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      repositoryRepository: new RepositoryPrismaRepository(prisma),
      resourceRepository: new ResourcePrismaRepository(prisma),
      folderRepository: new FolderPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using PowerSync database contract (Desktop)
   */
  static createPowerSyncRepositories(db: IElectronDatabase) {
    return {
      repositoryRepository: new PowerSyncRepositoryRepository(db),
      resourceRepository: new PowerSyncResourceRepository(db),
      folderRepository: new PowerSyncFolderRepository(db),
    };
  }

  /**
   * Create repositories based on data source type.
   * Overloads provide correct narrowing so no cast is needed at call sites.
   */
  static create(dataSource: 'prisma', client: PrismaClient): RepositoryImplementations;
  static create(dataSource: 'powersync', client: IElectronDatabase): RepositoryImplementations;
  static create(...args: ['prisma', PrismaClient] | ['powersync', IElectronDatabase]): RepositoryImplementations {
    const [dataSource, client] = args;
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client);
    }
    return this.createPowerSyncRepositories(client);
  }
}
