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

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@/domain-server';

import {
  RepositoryApplicationService,
  RepositorySyncApplicationService,
  RepositoryPermissionApplicationService,
  ResourceApplicationService,
  FolderApplicationService,
  RepositoryStatisticsApplicationService,
} from '@/application-server';

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
