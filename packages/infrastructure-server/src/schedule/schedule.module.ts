import type {  PrismaClient  } from "@prisma/client";
import {
  SchedulePrismaRepository,
  ScheduleExecutionPrismaRepository,
  ScheduleStatisticsPrismaRepository,
  ScheduleTaskPrismaRepository,
} from './adapters/prisma';
import {
  ScheduleApplicationService,
  ScheduleStatisticsApplicationService,
  ScheduleEventApplicationService
} from '@dailyuse/application-server/schedule';
// import { ScheduleConflictDetectionService } from '@dailyuse/application-server/schedule';

export class ScheduleModule {
  public readonly scheduleRepository: SchedulePrismaRepository;
  public readonly scheduleExecutionRepository: ScheduleExecutionPrismaRepository;
  public readonly scheduleStatisticsRepository: ScheduleStatisticsPrismaRepository;
  public readonly scheduleTaskRepository: ScheduleTaskPrismaRepository;

  public readonly scheduleService: ScheduleApplicationService;
  public readonly scheduleStatisticsService: ScheduleStatisticsApplicationService;
  public readonly scheduleEventService: ScheduleEventApplicationService;
  // public readonly scheduleConflictService: ScheduleConflictDetectionService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.scheduleRepository = new SchedulePrismaRepository(prisma);
    this.scheduleExecutionRepository = new ScheduleExecutionPrismaRepository(prisma);
    this.scheduleStatisticsRepository = new ScheduleStatisticsPrismaRepository(prisma);
    this.scheduleTaskRepository = new ScheduleTaskPrismaRepository(prisma);

    // 2. Initialize Services
    this.scheduleService = new ScheduleApplicationService(
      this.scheduleTaskRepository,
      this.scheduleStatisticsRepository
    );

    this.scheduleStatisticsService = new ScheduleStatisticsApplicationService(
      this.scheduleStatisticsRepository,
      this.scheduleTaskRepository
    );

    this.scheduleEventService = new ScheduleEventApplicationService(
      this.scheduleRepository
    );
    
    // this.scheduleConflictService = new ScheduleConflictDetectionService(this.scheduleRepository);
  }
}
