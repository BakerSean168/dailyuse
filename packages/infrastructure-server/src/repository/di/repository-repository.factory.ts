/**
 * Repository Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '../../generated/prisma/client';
import type Database from 'better-sqlite3';

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

import {
  RepositoryPrismaRepository,
  ResourcePrismaRepository,
  FolderPrismaRepository,
  RepositoryStatisticsPrismaRepository,
} from '../adapters/prisma';

import {
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
  SqliteRepositoryStatisticsRepository,
} from '../adapters/sqlite';

type BetterSQLiteDB = Database.Database;

/**
 * Repository Repository Factory
 */
export class RepositoryRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      repositoryRepository: new RepositoryPrismaRepository(prisma),
      resourceRepository: new ResourcePrismaRepository(prisma),
      folderRepository: new FolderPrismaRepository(prisma),
      statisticsRepository: new RepositoryStatisticsPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      repositoryRepository: new SqliteRepositoryRepository(db),
      resourceRepository: new SqliteResourceRepository(db),
      folderRepository: new SqliteFolderRepository(db),
      statisticsRepository: new SqliteRepositoryStatisticsRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof RepositoryRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }
}
