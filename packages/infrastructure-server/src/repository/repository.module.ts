/**
 * Repository Module
 * 
 * Infrastructure-level composition of Repository domain services and repositories.
 * Follows ADR-025: Module Composition Pattern
 */

import type { PrismaClient } from '@prisma/client';
import {
  RepositoryApplicationService,
  RepositorySyncApplicationService,
  RepositoryPermissionApplicationService,
  // TODO: ResourceApplicationService not exported from application-server
  // TODO: FolderApplicationService not exported from application-server
  // TODO: RepositoryStatisticsApplicationService not exported from application-server
} from '@dailyuse/application-server/repository';

import { RepositoryPrismaRepository } from './adapters/prisma/repository-prisma.repository';
import { ResourcePrismaRepository } from './adapters/prisma/resource-prisma.repository';
import { FolderPrismaRepository } from './adapters/prisma/folder-prisma.repository';
import { RepositoryStatisticsPrismaRepository } from './adapters/prisma/repository-statistics-prisma.repository';

/**
 * Repository Module - DI Container
 * 
 * Instantiates all repositories and application services for the Repository domain.
 * Used by API and Worker applications to access repository functionality.
 * 
 * NOTE: This module is incomplete - waiting for application-server to export missing services
 */
export class RepositoryModule {
  // Repositories (Public for testing/inspection)
  public readonly repositoryRepository: RepositoryPrismaRepository;
  public readonly resourceRepository: ResourcePrismaRepository;
  public readonly folderRepository: FolderPrismaRepository;
  public readonly statisticsRepository: RepositoryStatisticsPrismaRepository;

  // Application Services (Public - injected into routes)
  public readonly repositoryService: RepositoryApplicationService;
  public readonly syncService: RepositorySyncApplicationService;
  public readonly permissionService: RepositoryPermissionApplicationService;
  // public readonly resourceService: ResourceApplicationService;  // TODO: Not exported
  // public readonly folderService: FolderApplicationService;  // TODO: Not exported
  // public readonly statisticsService: RepositoryStatisticsApplicationService;  // TODO: Not exported

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.repositoryRepository = new RepositoryPrismaRepository(prisma);
    this.resourceRepository = new ResourcePrismaRepository(prisma);
    this.folderRepository = new FolderPrismaRepository(prisma);
    this.statisticsRepository = new RepositoryStatisticsPrismaRepository(prisma);

    // 2. Initialize Application Services (Pure Dependency Injection)
    this.repositoryService = new RepositoryApplicationService(this.repositoryRepository);
    this.syncService = new RepositorySyncApplicationService();
    this.permissionService = new RepositoryPermissionApplicationService();
    // TODO: Initialize resourceService, folderService, statisticsService once services are exported
  }
}
