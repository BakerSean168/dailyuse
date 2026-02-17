/**
 * Repository Module
 * 
 * DI Container for Repository domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 * 
 * Usage:
 * ```typescript
 * // API (Prisma)
 * const repositoryModule = new RepositoryModule('prisma', prismaClient);
 * 
 * // Desktop (SQLite)
 * const repositoryModule = new RepositoryModule('sqlite', sqliteDb);
 * ```
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';

import type { IRepositoryRepository } from '../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../domain-server/repositories/IFolderRepository';
import type { IRepositoryStatisticsRepository } from '../domain-server/repositories/IRepositoryStatisticsRepository';

import { RepositorySyncApplicationService } from '../application-server/use-cases/commands/repository-sync-application-service';
import { RepositoryStatisticsApplicationService } from '../application-server/use-cases/commands/repository-statistics-application-service';

import { RepositoryRepositoryFactory } from './di/repository-repository.factory';
import { RepositoryContainer } from './di/repository-container-v2';

type BetterSQLiteDB = Database.Database;

export class RepositoryModule {
  // ============ Repositories (Public for testing) ============
  public readonly repositoryRepository: IRepositoryRepository;
  public readonly resourceRepository: IResourceRepository;
  public readonly folderRepository: IFolderRepository;
  public readonly statisticsRepository: IRepositoryStatisticsRepository;

  // ============ Application Services (Public - injected into routes) ============
  public readonly syncService: RepositorySyncApplicationService;
  public readonly statisticsService: RepositoryStatisticsApplicationService;

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // ============ Step 1: Initialize Repositories using Factory ============
    const repositories = RepositoryRepositoryFactory.create(dataSourceType, dbConnection);

    const container = RepositoryContainer.getInstance();
    container.reset();
    container.registerRepositoryRepository(repositories.repositoryRepository);
    container.registerResourceRepository(repositories.resourceRepository);
    container.registerFolderRepository(repositories.folderRepository);
    container.registerRepositoryStatisticsRepository(repositories.statisticsRepository);

    this.repositoryRepository = container.getRepositoryRepository();
    this.resourceRepository = container.getResourceRepository();
    this.folderRepository = container.getFolderRepository();
    this.statisticsRepository = container.getRepositoryStatisticsRepository();

    // ============ Step 2: Initialize Application Services (Pure DI) ============
    this.syncService = new RepositorySyncApplicationService();
    this.statisticsService = new RepositoryStatisticsApplicationService();
  }
}
