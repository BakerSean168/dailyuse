import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import { ScheduleApplicationService } from '../application-server/services/schedule-application-service';
import { ScheduleStatisticsApplicationService } from '../application-server/services/schedule-statistics-application-service';
import { ScheduleEventApplicationService } from '../application-server/services/schedule-event-application-service';
import { ScheduleRepositoryFactory } from './di';

type BetterSQLiteDB = Database.Database;

type ScheduleRepositories = ReturnType<
  typeof ScheduleRepositoryFactory.createPrismaRepositories
>;

export class ScheduleModule {
  public readonly scheduleRepository: ScheduleRepositories['scheduleRepository'];
  public readonly scheduleExecutionRepository: ScheduleRepositories['scheduleExecutionRepository'];
  public readonly scheduleStatisticsRepository: ScheduleRepositories['scheduleStatisticsRepository'];
  public readonly scheduleTaskRepository: ScheduleRepositories['scheduleTaskRepository'];

  public readonly scheduleService: ScheduleApplicationService;
  public readonly scheduleStatisticsService: ScheduleStatisticsApplicationService;
  public readonly scheduleEventService: ScheduleEventApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = ScheduleRepositoryFactory.create(dataSourceType, dbConnection);
    this.scheduleRepository = repositories.scheduleRepository;
    this.scheduleExecutionRepository = repositories.scheduleExecutionRepository;
    this.scheduleStatisticsRepository = repositories.scheduleStatisticsRepository;
    this.scheduleTaskRepository = repositories.scheduleTaskRepository;

    // 2. Initialize Services
    this.scheduleService = new ScheduleApplicationService(
      this.scheduleTaskRepository,
      this.scheduleStatisticsRepository,
    );

    this.scheduleStatisticsService = new ScheduleStatisticsApplicationService(
      this.scheduleStatisticsRepository,
      this.scheduleTaskRepository,
    );

    this.scheduleEventService = new ScheduleEventApplicationService(
      this.scheduleRepository,
    );
  }
}
