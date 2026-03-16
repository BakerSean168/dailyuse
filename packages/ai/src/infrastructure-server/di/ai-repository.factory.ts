/**
 * AI Repository Factory
 * AI 仓储工厂
 *
 * Provides repository implementations for different data sources.
 * 根据不同数据源提供仓储实现。
 *
 * @deprecated Use `createAIModule()` or `createAIPowerSyncModule()` composition roots instead.
 *   The composition root now handles repository creation internally, making this factory unnecessary.
 * @deprecated 请使用 `createAIModule()` 或 `createAIPowerSyncModule()` 组合根替代。
 *   组合根现在在内部处理仓储创建，不再需要此工厂。
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
 * @deprecated Use `createAIModule()` or `createAIPowerSyncModule()` composition roots instead.
 * @deprecated 请使用 `createAIModule()` 或 `createAIPowerSyncModule()` 组合根替代。
 *
 * Provides repository implementations for different data sources.
 * 根据不同数据源提供仓储实现。
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
