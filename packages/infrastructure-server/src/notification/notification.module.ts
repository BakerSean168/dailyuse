import type {  PrismaClient  } from "@prisma/client";
import {
  PrismaNotificationRepository,
  PrismaNotificationPreferenceRepository,
  PrismaNotificationTemplateRepository
} from './repositories';
import {
  NotificationApplicationService,
  NotificationTemplateApplicationService,
  NotificationChannelApplicationService
} from '@dailyuse/application-server/notification';

export class NotificationModule {
  public readonly notificationRepository: PrismaNotificationRepository;
  public readonly notificationPreferenceRepository: PrismaNotificationPreferenceRepository;
  public readonly notificationTemplateRepository: PrismaNotificationTemplateRepository;

  public readonly notificationService: NotificationApplicationService;
  public readonly notificationTemplateService: NotificationTemplateApplicationService;
  public readonly notificationChannelService: NotificationChannelApplicationService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.notificationRepository = new PrismaNotificationRepository(prisma);
    this.notificationPreferenceRepository = new PrismaNotificationPreferenceRepository(prisma);
    this.notificationTemplateRepository = new PrismaNotificationTemplateRepository(prisma);

    // 2. Initialize Services
    this.notificationService = new NotificationApplicationService(
      this.notificationRepository,
      this.notificationPreferenceRepository,
      this.notificationTemplateRepository
    );

    this.notificationTemplateService = new NotificationTemplateApplicationService(
      this.notificationTemplateRepository
    );

    this.notificationChannelService = new NotificationChannelApplicationService();
  }
}
