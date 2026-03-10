/**
 * Reminder Module - Composition Root
 * 提醒模块组合根
 *
 * 负责初始化 Prisma 仓储和应用服务
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IReminderTemplateRepository } from '../domain-server/repositories/IReminderTemplateRepository';
import type { IReminderGroupRepository } from '../domain-server/repositories/IReminderGroupRepository';
import type { IReminderResponseRepository } from '../domain-server/repositories/IReminderResponseRepository';
import type { IUserReminderPreferenceRepository } from '../domain-server/repositories/IUserReminderPreferenceRepository';
import { ReminderTemplatePrismaRepository } from './adapters/prisma/reminder-template-prisma.repository';
import { ReminderGroupPrismaRepository } from './adapters/prisma/reminder-group-prisma.repository';
import { ReminderResponsePrismaRepository } from './adapters/prisma/reminder-response-prisma.repository';
import { UserReminderPreferencePrismaRepository } from './adapters/prisma/user-reminder-preference-prisma.repository';
import { ReminderContainer } from './di/reminder-container';

/**
 * Reminder Module
 * Composition Root for Reminder domain
 */
export class ReminderModule {
  public readonly reminderTemplateRepository: IReminderTemplateRepository;
  public readonly reminderGroupRepository: IReminderGroupRepository;
  public readonly reminderResponseRepository: IReminderResponseRepository;
  public readonly userReminderPreferenceRepository: IUserReminderPreferenceRepository;

  constructor(dbConnection: PrismaClient) {
    const reminderTemplateRepository = new ReminderTemplatePrismaRepository(dbConnection);
    const reminderGroupRepository = new ReminderGroupPrismaRepository(dbConnection);
    const reminderResponseRepository = new ReminderResponsePrismaRepository(dbConnection);
    const userReminderPreferenceRepository = new UserReminderPreferencePrismaRepository(
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
