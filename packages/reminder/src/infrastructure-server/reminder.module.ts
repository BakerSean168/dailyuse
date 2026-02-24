/**
 * Reminder Module - Composition Root
 * 提醒模块组合根
 *
 * 负责初始化仓储和应用服务
 * 支持 Prisma (API) 和 SQLite (Desktop) 数据源
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import type { IReminderTemplateRepository } from '../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../domain-server/repositories/IReminderGroupRepository';
import type { IReminderResponseRepository } from '../domain-server/repositories/IReminderResponseRepository';
import type { IUserReminderPreferenceRepository } from '../domain-server/repositories/IUserReminderPreferenceRepository';
import { ReminderRepositoryFactory } from './di';
import { ReminderContainer } from './di/reminder-container';

type BetterSQLiteDB = Database.Database;

/**
 * Reminder Module
 * Composition Root for Reminder domain
 */
export class ReminderModule {
  public readonly reminderTemplateRepository: IReminderTemplateRepository;
  public readonly reminderGroupRepository: IReminderGroupRepository;
  public readonly reminderResponseRepository: IReminderResponseRepository;
  public readonly userReminderPreferenceRepository: IUserReminderPreferenceRepository;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // Initialize Repositories using Factory
    const reminderTemplateRepository = ReminderRepositoryFactory.createReminderTemplateRepository(
      dataSourceType,
      dbConnection,
    );
    const reminderGroupRepository = ReminderRepositoryFactory.createReminderGroupRepository(
      dataSourceType,
      dbConnection,
    );
    const reminderResponseRepository = ReminderRepositoryFactory.createReminderResponseRepository(
      dataSourceType,
      dbConnection,
    );

    const userReminderPreferenceRepository =
      ReminderRepositoryFactory.createUserReminderPreferenceRepository(
        dataSourceType,
        dbConnection,
      );

    const container = ReminderContainer.getInstance();
    container.reset();
    container.setReminderTemplateRepository(reminderTemplateRepository);
    container.setReminderGroupRepository(reminderGroupRepository);
    container.setReminderResponseRepository(reminderResponseRepository);
    container.setUserReminderPreferenceRepository(userReminderPreferenceRepository);

    this.reminderTemplateRepository = container.getReminderTemplateRepository();
    this.reminderGroupRepository = container.getReminderGroupRepository();
    this.reminderResponseRepository = container.getReminderResponseRepository();

    this.userReminderPreferenceRepository = userReminderPreferenceRepository;
  }
}
