/**
 * Notification Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '../../generated/prisma/client';
import type Database from 'better-sqlite3';

import {
  NotificationPrismaRepository,
  NotificationPreferencePrismaRepository,
  NotificationTemplatePrismaRepository,
} from '../adapters/prisma';

import {
  SqliteNotificationRepository,
  SqliteNotificationPreferenceRepository,
  SqliteNotificationTemplateRepository,
} from '../adapters/sqlite';

type BetterSQLiteDB = Database.Database;

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
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      notificationRepository: new SqliteNotificationRepository(db),
      notificationPreferenceRepository: new SqliteNotificationPreferenceRepository(db),
      notificationTemplateRepository: new SqliteNotificationTemplateRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof NotificationRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }
}
