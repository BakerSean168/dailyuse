/**
 * Notification Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

import {
  NotificationPrismaRepository,
  NotificationPreferencePrismaRepository,
  NotificationTemplatePrismaRepository,
} from '../adapters/prisma';

import {
  PowerSyncNotificationRepository,
  PowerSyncNotificationPreferenceRepository,
  PowerSyncNotificationTemplateRepository,
} from '../adapters/powersync';

/**
 * Notification Repository Factory
 */
export class NotificationRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      notificationRepository: new NotificationPrismaRepository(prisma),
      notificationPreferenceRepository: new NotificationPreferencePrismaRepository(prisma),
      notificationTemplateRepository: new NotificationTemplatePrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using PowerSync database contract (Desktop)
   */
  static createPowerSyncRepositories(db: IElectronDatabase) {
    return {
      notificationRepository: new PowerSyncNotificationRepository(db),
      notificationPreferenceRepository: new PowerSyncNotificationPreferenceRepository(db),
      notificationTemplateRepository: new PowerSyncNotificationTemplateRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'powersync',
    client: PrismaClient | IElectronDatabase,
  ): ReturnType<typeof NotificationRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as unknown as ReturnType<typeof NotificationRepositoryFactory.createPrismaRepositories>;
    } else {
      return this.createPowerSyncRepositories(client as IElectronDatabase) as unknown as ReturnType<typeof NotificationRepositoryFactory.createPrismaRepositories>;
    }
  }
}
