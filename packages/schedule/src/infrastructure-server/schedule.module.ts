import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import type {
  IScheduleExecutionRepository,
  IScheduleRepository,
  IScheduleStatisticsRepository,
  IScheduleTaskRepository,
} from '@/domain-server';

import {
  CreateScheduleTaskUseCase,
  DeleteScheduleTaskUseCase,
  ListScheduleTasksBySourceUseCase,
  PauseScheduleTaskUseCase,
  ResumeScheduleTaskUseCase,
  GetScheduleTaskUseCase,
  ListScheduleTasksByAccountUseCase,
  ListScheduleTasksByStatusUseCase,
  TriggerScheduleTaskUseCase,
  UpdateScheduleTaskUseCase,
} from '@/application-server/use-cases';
import { ScheduleStatisticsApplicationService } from '@/application-server/services/schedule-statistics-application-service';
import { ScheduleEventApplicationService } from '@/application-server/services/schedule-event-application-service';
import { ScheduleEventPublisher } from '@/application-server/use-cases/schedule-event-publisher';
import { ScheduleRepositoryFactory } from '@/infrastructure-server/di';
import { ScheduleContainer } from '@/infrastructure-server/di/schedule-container';

type BetterSQLiteDB = Database.Database;

export class ScheduleModule {
  public readonly scheduleRepository: IScheduleRepository;
  public readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  public readonly scheduleStatisticsRepository: IScheduleStatisticsRepository;
  public readonly scheduleTaskRepository: IScheduleTaskRepository;

  public readonly createScheduleTask: CreateScheduleTaskUseCase;
  public readonly updateScheduleTask: UpdateScheduleTaskUseCase;
  public readonly deleteScheduleTask: DeleteScheduleTaskUseCase;
  public readonly pauseScheduleTask: PauseScheduleTaskUseCase;
  public readonly resumeScheduleTask: ResumeScheduleTaskUseCase;
  public readonly triggerScheduleTask: TriggerScheduleTaskUseCase;
  public readonly getScheduleTask: GetScheduleTaskUseCase;
  public readonly listScheduleTasksByAccount: ListScheduleTasksByAccountUseCase;
  public readonly listScheduleTasksBySource: ListScheduleTasksBySourceUseCase;
  public readonly listScheduleTasksByStatus: ListScheduleTasksByStatusUseCase;
  public readonly scheduleStatisticsService: ScheduleStatisticsApplicationService;
  public readonly scheduleEventService: ScheduleEventApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = ScheduleRepositoryFactory.create(dataSourceType, dbConnection);
    const container = ScheduleContainer.getInstance();
    container.reset();
    container.setScheduleRepository(repositories.scheduleRepository);
    container.setScheduleExecutionRepository(repositories.scheduleExecutionRepository);
    container.setScheduleStatisticsRepository(repositories.scheduleStatisticsRepository);
    container.setScheduleTaskRepository(repositories.scheduleTaskRepository);

    this.scheduleRepository = container.getScheduleRepository();
    this.scheduleExecutionRepository = container.getScheduleExecutionRepository();
    this.scheduleStatisticsRepository = container.getScheduleStatisticsRepository();
    this.scheduleTaskRepository = container.getScheduleTaskRepository();

    // 2. Initialize Services
    this.createScheduleTask = new CreateScheduleTaskUseCase(
      this.scheduleTaskRepository,
      this.scheduleStatisticsRepository,
    );
    this.updateScheduleTask = new UpdateScheduleTaskUseCase(this.scheduleTaskRepository);
    this.deleteScheduleTask = new DeleteScheduleTaskUseCase(this.scheduleTaskRepository);
    this.pauseScheduleTask = new PauseScheduleTaskUseCase(this.scheduleTaskRepository);
    this.resumeScheduleTask = new ResumeScheduleTaskUseCase(this.scheduleTaskRepository);
    this.triggerScheduleTask = new TriggerScheduleTaskUseCase(this.scheduleTaskRepository);
    this.getScheduleTask = new GetScheduleTaskUseCase(this.scheduleTaskRepository);
    this.listScheduleTasksByAccount = new ListScheduleTasksByAccountUseCase(this.scheduleTaskRepository);
    this.listScheduleTasksBySource = new ListScheduleTasksBySourceUseCase(this.scheduleTaskRepository);
    this.listScheduleTasksByStatus = new ListScheduleTasksByStatusUseCase(this.scheduleTaskRepository);

    this.scheduleStatisticsService = new ScheduleStatisticsApplicationService(
      this.scheduleStatisticsRepository,
      this.scheduleTaskRepository,
    );

    this.scheduleEventService = new ScheduleEventApplicationService(
      this.scheduleRepository,
    );

    ScheduleEventPublisher.configure({
      createScheduleTask: this.createScheduleTask,
      listScheduleTasksBySource: this.listScheduleTasksBySource,
      deleteScheduleTask: this.deleteScheduleTask,
      pauseScheduleTask: this.pauseScheduleTask,
      resumeScheduleTask: this.resumeScheduleTask,
    });
  }
}
