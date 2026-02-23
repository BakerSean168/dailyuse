/**
 * Setting Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import { UserSettingPrismaRepository } from '../adapters/prisma/index';

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
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: unknown,
  ) {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient);
    }
    throw new Error(`Unsupported data source: ${dataSource}`);
  }
}
