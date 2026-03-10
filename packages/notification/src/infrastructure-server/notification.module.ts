import type { PrismaClient } from '@dailyuse/database';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type {
  INotificationPreferenceRepository,
  INotificationRepository,
  INotificationTemplateRepository,
} from '../domain-server/repositories';

import {
  NotificationApplicationService,
  NotificationTemplateApplicationService,
  NotificationChannelApplicationService,
} from '../application-server/use-cases/commands/notification-application-services';
import { NotificationRepositoryFactory } from './di';
import { NotificationContainer } from './di/notification-container';

export class NotificationModule {
  public readonly notificationRepository: INotificationRepository;
  public readonly notificationPreferenceRepository: INotificationPreferenceRepository;
  public readonly notificationTemplateRepository: INotificationTemplateRepository;

  public readonly notificationService: NotificationApplicationService;
  public readonly notificationTemplateService: NotificationTemplateApplicationService;
  public readonly notificationChannelService: NotificationChannelApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'powersync',
    dbConnection: PrismaClient | IElectronDatabase,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = NotificationRepositoryFactory.create(dataSourceType, dbConnection);

    // 2. Register repositories in DI container
    const container = NotificationContainer.getInstance();
    container.reset();
    container.setNotificationRepository(repositories.notificationRepository);
    container.setNotificationPreferenceRepository(repositories.notificationPreferenceRepository);
    container.setNotificationTemplateRepository(repositories.notificationTemplateRepository);

    this.notificationRepository = container.getNotificationRepository();
    this.notificationPreferenceRepository = container.getNotificationPreferenceRepository();
    this.notificationTemplateRepository = container.getNotificationTemplateRepository();

    // 3. Initialize Services
    this.notificationService = new NotificationApplicationService();
    this.notificationTemplateService = new NotificationTemplateApplicationService();
    this.notificationChannelService = new NotificationChannelApplicationService();
  }
}
