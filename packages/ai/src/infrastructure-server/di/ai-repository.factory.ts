/**
 * AI Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

import {
  AIConversationPrismaRepository,
  AIProviderConfigPrismaRepository,
} from '../adapters/prisma';
import {
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
} from '../adapters/powersync';

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
   * Create repositories using PowerSync (for Desktop)
   */
  static createPowerSyncRepositories(db: IElectronDatabase) {
    return {
      conversationRepository: new PowerSyncAIConversationRepository(db),
      providerConfigRepository: new PowerSyncAIProviderConfigRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'powersync',
    client: PrismaClient | IElectronDatabase,
  ): ReturnType<typeof AIRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createPowerSyncRepositories(client as IElectronDatabase) as any;
    }
  }
}
