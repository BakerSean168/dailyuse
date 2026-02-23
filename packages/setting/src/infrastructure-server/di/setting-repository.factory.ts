/**
 * Setting Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import { UserSettingPrismaRepository } from '../adapters/prisma/index';
import { SqliteUserSettingRepository } from '../adapters/sqlite/index';

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
   * Create repositories using SQLite (for desktop/local-first)
   */
  static createSqliteRepositories(sqlite: Database.Database) {
    return {
      userSettingRepository: new SqliteUserSettingRepository(sqlite),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: unknown,
  ) {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient);
    }

    if (dataSource === 'sqlite') {
      return this.createSqliteRepositories(client as Database.Database);
    }

    throw new Error(`Unsupported data source: ${String(dataSource)}`);
  }
}
