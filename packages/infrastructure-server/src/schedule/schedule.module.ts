import { PrismaClient } from '@prisma/client';
import {
  PrismaScheduleRepository,
  PrismaScheduleExecutionRepository,
  PrismaScheduleStatisticsRepository,
  PrismaScheduleTaskRepository,
} from './repositories';
import {
  ScheduleApplicationService,
  ScheduleStatisticsApplicationService,
  ScheduleEventApplicationService
} from '@dailyuse/application-server/schedule';
// import { ScheduleConflictDetectionService } from '@dailyuse/application-server/schedule';

export class ScheduleModule {
  public readonly scheduleRepository: PrismaScheduleRepository;
  public readonly scheduleExecutionRepository: PrismaScheduleExecutionRepository;
  public readonly scheduleStatisticsRepository: PrismaScheduleStatisticsRepository;
  public readonly scheduleTaskRepository: PrismaScheduleTaskRepository;

  public readonly scheduleService: ScheduleApplicationService;
  public readonly scheduleStatisticsService: ScheduleStatisticsApplicationService;
  public readonly scheduleEventService: ScheduleEventApplicationService;
  // public readonly scheduleConflictService: ScheduleConflictDetectionService;

  constructor(prisma: PrismaClient) {
    // 1. Initialize Repositories
    this.scheduleRepository = new PrismaScheduleRepository(prisma);
    this.scheduleExecutionRepository = new PrismaScheduleExecutionRepository(prisma);
    this.scheduleStatisticsRepository = new PrismaScheduleStatisticsRepository(prisma);
    this.scheduleTaskRepository = new PrismaScheduleTaskRepository(prisma);

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
