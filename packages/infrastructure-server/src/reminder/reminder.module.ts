import type {  PrismaClient  } from "@prisma/client";
import {
  PrismaReminderTemplateRepository,
  PrismaReminderGroupRepository,
  PrismaReminderStatisticsRepository,
  PrismaReminderResponseRepository,
} from './repositories';
import {
  ReminderApplicationService,
  ReminderQueryApplicationService,
  ReminderStatisticsApplicationService,
} from '@dailyuse/application-server/reminder';

export class ReminderModule {
  public readonly reminderTemplateRepository: PrismaReminderTemplateRepository;
  public readonly reminderGroupRepository: PrismaReminderGroupRepository;
  public readonly reminderStatisticsRepository: PrismaReminderStatisticsRepository;
  public readonly reminderResponseRepository: PrismaReminderResponseRepository;

  public readonly reminderService: ReminderApplicationService;
  public readonly reminderQueryService: ReminderQueryApplicationService;
  public readonly reminderStatisticsService: ReminderStatisticsApplicationService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.reminderTemplateRepository = new PrismaReminderTemplateRepository(prisma);
    this.reminderGroupRepository = new PrismaReminderGroupRepository(prisma);
    this.reminderStatisticsRepository = new PrismaReminderStatisticsRepository(prisma);
    this.reminderResponseRepository = new PrismaReminderResponseRepository(prisma);

    // 2. Initialize Services
    this.reminderService = new ReminderApplicationService(
      this.reminderTemplateRepository,
      this.reminderGroupRepository,
      this.reminderStatisticsRepository
    );

    this.reminderQueryService = new ReminderQueryApplicationService(
      this.reminderTemplateRepository
    );

    this.reminderStatisticsService = new ReminderStatisticsApplicationService(
      this.reminderStatisticsRepository
    );
  }
}
