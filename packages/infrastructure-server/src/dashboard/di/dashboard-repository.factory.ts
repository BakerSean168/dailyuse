/**
 * Dashboard Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';

import { DashboardConfigPrismaRepository } from '../adapters/prisma/dashboard-config-prisma.repository';
import { SqliteDashboardConfigRepository } from '../adapters/sqlite/dashboard-config-sqlite.repository';

type BetterSQLiteDB = Database.Database;

/**
 * Dashboard Repository Factory
 */
export class DashboardRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      dashboardRepository: new DashboardConfigPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      dashboardRepository: new SqliteDashboardConfigRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof DashboardRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }
}
