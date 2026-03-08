/**
 * AI Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';

import {
  AIConversationPrismaRepository,
  AIProviderConfigPrismaRepository,
} from '../adapters/prisma';
import {
  SqliteAIConversationRepository,
  SqliteAIProviderConfigRepository,
} from '../adapters/sqlite';

type BetterSQLiteDB = Database.Database;

/**
 * AI Repository Factory
 */
export class AIRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      conversationRepository: new AIConversationPrismaRepository(prisma),
      providerConfigRepository: new AIProviderConfigPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      conversationRepository: new SqliteAIConversationRepository(db),
      providerConfigRepository: new SqliteAIProviderConfigRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof AIRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }
}
