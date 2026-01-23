import type {  PrismaClient  } from "@prisma/client";
import {
  NotificationPrismaRepository,
  NotificationPreferencePrismaRepository,
  NotificationTemplatePrismaRepository
} from './adapters/prisma';
import {
  NotificationApplicationService,
  NotificationTemplateApplicationService,
  NotificationChannelApplicationService
} from '@dailyuse/application-server/notification';

export class NotificationModule {
  public readonly notificationRepository: NotificationPrismaRepository;
  public readonly notificationPreferenceRepository: NotificationPreferencePrismaRepository;
  public readonly notificationTemplateRepository: NotificationTemplatePrismaRepository;

  public readonly notificationService: NotificationApplicationService;
  public readonly notificationTemplateService: NotificationTemplateApplicationService;
  public readonly notificationChannelService: NotificationChannelApplicationService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.notificationRepository = new NotificationPrismaRepository(prisma);
    this.notificationPreferenceRepository = new NotificationPreferencePrismaRepository(prisma);
    this.notificationTemplateRepository = new NotificationTemplatePrismaRepository(prisma);

    // 2. Initialize Services
    this.notificationService = new NotificationApplicationService();
    this.notificationTemplateService = new NotificationTemplateApplicationService();
    this.notificationChannelService = new NotificationChannelApplicationService();
  }
}
