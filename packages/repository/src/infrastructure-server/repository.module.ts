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

import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import type { IRepositoryRepository } from '../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../domain-server/repositories/IFolderRepository';
import type { IRepositoryStatisticsRepository } from '../domain-server/repositories/IRepositoryStatisticsRepository';

import { RepositoryApplicationService } from '../application-server/services/repository-application-service';
import { RepositorySyncApplicationService } from '../application-server/services/repository-sync-application-service';
import { RepositoryPermissionApplicationService } from '../application-server/services/repository-permission-application-service';
import { ResourceApplicationService } from '../application-server/services/resource-application-service';
import { FolderApplicationService } from '../application-server/services/folder-application-service';
import { RepositoryStatisticsApplicationService } from '../application-server/services/repository-statistics-application-service';

import { RepositoryRepositoryFactory } from './di/repository-repository.factory';

type BetterSQLiteDB = Database.Database;

export class RepositoryModule {
  // ============ Repositories (Public for testing) ============
  public readonly repositoryRepository: IRepositoryRepository;
  public readonly resourceRepository: IResourceRepository;
  public readonly folderRepository: IFolderRepository;
  public readonly statisticsRepository: IRepositoryStatisticsRepository;

  // ============ Application Services (Public - injected into routes) ============
  public readonly repositoryService: RepositoryApplicationService;
  public readonly syncService: RepositorySyncApplicationService;
  public readonly permissionService: RepositoryPermissionApplicationService;
  public readonly resourceService: ResourceApplicationService;
  public readonly folderService: FolderApplicationService;
  public readonly statisticsService: RepositoryStatisticsApplicationService;

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // ============ Step 1: Initialize Repositories using Factory ============
    const repositories = RepositoryRepositoryFactory.create(dataSourceType, dbConnection);
    
    this.repositoryRepository = repositories.repositoryRepository;
    this.resourceRepository = repositories.resourceRepository;
    this.folderRepository = repositories.folderRepository;
    this.statisticsRepository = repositories.statisticsRepository;

    // ============ Step 2: Initialize Application Services (Pure DI) ============
    this.repositoryService = new RepositoryApplicationService(this.repositoryRepository);
    this.syncService = new RepositorySyncApplicationService();
    this.permissionService = new RepositoryPermissionApplicationService();
    this.resourceService = new ResourceApplicationService(this.resourceRepository);
    this.folderService = new FolderApplicationService(this.folderRepository);
    this.statisticsService = new RepositoryStatisticsApplicationService(this.statisticsRepository);
  }
}
