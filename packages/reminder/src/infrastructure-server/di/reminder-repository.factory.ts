/**
 * Reminder Repository Factory
 * 提醒仓储工厂
 *
 * 根据数据源类型创建对应的仓储实例
 * 支持: Prisma (API/Server), SQLite (Desktop)
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import type { IReminderTemplateRepository } from '../../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../../domain-server/repositories/IReminderGroupRepository';
import type { IReminderResponseRepository } from '../../domain-server/repositories/IReminderResponseRepository';
import type { IUserReminderPreferenceRepository } from '../../domain-server/repositories/IUserReminderPreferenceRepository';
import { ReminderTemplatePrismaRepository } from '../adapters/prisma/reminder-template-prisma.repository';
import { ReminderGroupPrismaRepository } from '../adapters/prisma/reminder-group-prisma.repository';
import { ReminderResponsePrismaRepository } from '../adapters/prisma/reminder-response-prisma.repository';
import { UserReminderPreferencePrismaRepository } from '../adapters/prisma/user-reminder-preference-prisma.repository';
import { SqliteReminderTemplateRepository } from '../adapters/sqlite/reminder-template-sqlite.repository';
import { SqliteReminderGroupRepository } from '../adapters/sqlite/reminder-group-sqlite.repository';
import { SqliteReminderResponseRepository } from '../adapters/sqlite/reminder-response-sqlite.repository';

type BetterSQLiteDB = Database.Database;

/**
 * Reminder Repository Factory
 */
export class ReminderRepositoryFactory {
  static createReminderTemplateRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): IReminderTemplateRepository {
    if (dataSourceType === 'prisma') {
      return new ReminderTemplatePrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteReminderTemplateRepository(dbConnection as BetterSQLiteDB);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  static createReminderGroupRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): IReminderGroupRepository {
    if (dataSourceType === 'prisma') {
      return new ReminderGroupPrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteReminderGroupRepository(dbConnection as BetterSQLiteDB);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  static createReminderResponseRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): IReminderResponseRepository {
    if (dataSourceType === 'prisma') {
      return new ReminderResponsePrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteReminderResponseRepository(dbConnection as BetterSQLiteDB);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  static createUserReminderPreferenceRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): IUserReminderPreferenceRepository {
    if (dataSourceType === 'prisma') {
      return new UserReminderPreferencePrismaRepository(dbConnection as PrismaClient);
    }
    // TODO: SQLite user preference adapter not yet implemented
    throw new Error(`UserReminderPreference SQLite adapter not implemented. Use Prisma.`);
  }

  /**
   * Create all Reminder repositories at once (convenience method)
   */
  static createAllRepositories(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    return {
      reminderTemplateRepository: this.createReminderTemplateRepository(dataSourceType, dbConnection),
      reminderGroupRepository: this.createReminderGroupRepository(dataSourceType, dbConnection),
      reminderResponseRepository: this.createReminderResponseRepository(dataSourceType, dbConnection),
      ...(dataSourceType === 'prisma'
        ? { userReminderPreferenceRepository: this.createUserReminderPreferenceRepository(dataSourceType, dbConnection) }
        : {}),
    };
  }
}

