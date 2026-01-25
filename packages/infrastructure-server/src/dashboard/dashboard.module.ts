/**
 * Dashboard Module
 * 
 * DI Container for Dashboard domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 * 
 * Usage:
 * ```typescript
 * // API (Prisma)
 * const dashboardModule = new DashboardModule('prisma', prismaClient);
 * 
 * // Desktop (SQLite)
 * const dashboardModule = new DashboardModule('sqlite', sqliteDb);
 * ```
 */

import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';

import {
  DashboardApplicationService,
} from '@dailyuse/application-server/dashboard';

import { DashboardRepositoryFactory } from './di/dashboard-repository.factory';

type BetterSQLiteDB = Database.Database;

export class DashboardModule {
  // ============ Repositories (Public for testing) ============
  public readonly dashboardRepository: IDashboardConfigRepository;

  // ============ Application Services (Public - injected into routes) ============
  public readonly dashboardService: DashboardApplicationService;

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // ============ Step 1: Initialize Repositories using Factory ============
    const repositories = DashboardRepositoryFactory.create(dataSourceType, dbConnection);
    
    this.dashboardRepository = repositories.dashboardRepository;

    // ============ Step 2: Initialize Application Services (Pure DI) ============
    this.dashboardService = new DashboardApplicationService();
  }
}
