/**
 * Setting Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import { UserSettingPrismaRepository } from '../adapters/prisma/index';
import { SqliteUserSettingRepository } from '../adapters/sqlite/index';

type BetterSQLiteDB = Database.Database;

/**
 * Setting Repository Factory
 */
export class SettingRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      userSettingRepository: new UserSettingPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      userSettingRepository: new SqliteUserSettingRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof SettingRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }
}
