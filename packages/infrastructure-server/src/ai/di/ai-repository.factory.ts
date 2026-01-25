/**
 * AI Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import {
  AIConversationPrismaRepository,
  AIGenerationTaskPrismaRepository,
  AIProviderConfigPrismaRepository,
  AIUsageQuotaPrismaRepository,
} from '../adapters/prisma';

import {
  SqliteAIConversationRepository,
  SqliteAIGenerationTaskRepository,
  SqliteAIProviderConfigRepository,
  SqliteAIUsageQuotaRepository,
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
      generationTaskRepository: new AIGenerationTaskPrismaRepository(prisma),
      providerConfigRepository: new AIProviderConfigPrismaRepository(prisma),
      usageQuotaRepository: new AIUsageQuotaPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      conversationRepository: new SqliteAIConversationRepository(db),
      generationTaskRepository: new SqliteAIGenerationTaskRepository(db),
      providerConfigRepository: new SqliteAIProviderConfigRepository(db),
      usageQuotaRepository: new SqliteAIUsageQuotaRepository(db),
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
