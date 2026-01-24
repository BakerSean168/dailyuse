/**
 * Dashboard Module
 * 
 * Infrastructure-level composition of Dashboard domain services and repositories.
 * Follows ADR-025: Module Composition Pattern
 */

import type { PrismaClient } from '@prisma/client';
import {
  DashboardApplicationService,
} from '@dailyuse/application-server/dashboard';

import { DashboardConfigPrismaRepository } from './adapters/prisma/dashboard-config-prisma.repository';

/**
 * Dashboard Module - DI Container
 * 
 * Instantiates all repositories and application services for the Dashboard domain.
 * Used by API and Worker applications to access dashboard functionality.
 */
export class DashboardModule {
  // Repositories (Public for testing/inspection)
  public readonly dashboardRepository: DashboardConfigPrismaRepository;

  // Application Services (Public - injected into routes)
  public readonly dashboardService: DashboardApplicationService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.dashboardRepository = new DashboardConfigPrismaRepository(prisma);

    // 2. Initialize Application Services (Pure Dependency Injection)
    this.dashboardService = new DashboardApplicationService();
  }
}
