import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import {
  NotificationApplicationService,
  NotificationTemplateApplicationService,
  NotificationChannelApplicationService,
} from '@/application-server';
import { NotificationRepositoryFactory } from './di';

type BetterSQLiteDB = Database.Database;

type NotificationRepositories = ReturnType<
  typeof NotificationRepositoryFactory.createPrismaRepositories
>;

export class NotificationModule {
  public readonly notificationRepository: NotificationRepositories['notificationRepository'];
  public readonly notificationPreferenceRepository: NotificationRepositories['notificationPreferenceRepository'];
  public readonly notificationTemplateRepository: NotificationRepositories['notificationTemplateRepository'];

  public readonly notificationService: NotificationApplicationService;
  public readonly notificationTemplateService: NotificationTemplateApplicationService;
  public readonly notificationChannelService: NotificationChannelApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = NotificationRepositoryFactory.create(dataSourceType, dbConnection);
    this.notificationRepository = repositories.notificationRepository;
    this.notificationPreferenceRepository = repositories.notificationPreferenceRepository;
    this.notificationTemplateRepository = repositories.notificationTemplateRepository;

    // 2. Initialize Services
    this.notificationService = new NotificationApplicationService();
    this.notificationTemplateService = new NotificationTemplateApplicationService();
    this.notificationChannelService = new NotificationChannelApplicationService();
  }
}
