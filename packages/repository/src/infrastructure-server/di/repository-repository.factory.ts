/**
 * Repository Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';

import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../../domain-server/repositories/IFolderRepository';

import {
  RepositoryPrismaRepository,
  ResourcePrismaRepository,
  FolderPrismaRepository,
} from '../adapters/prisma';

import {
  SqliteRepositoryRepository,
  SqliteResourceRepository,
  SqliteFolderRepository,
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
