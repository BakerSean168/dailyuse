import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';
import type {
  ITaskInstanceRepository,
} from '../domain-server/repositories/ITaskInstanceRepository';
import type {
  ITaskDependencyRepository,
} from '../domain-server/repositories/ITaskDependencyRepository';
import type {
  ITaskStatisticsRepository,
} from '../domain-server/repositories/ITaskStatisticsRepository';
import { TaskRepositoryFactory } from './di/task-repository.factory';
import {
  TaskInstanceApplicationService,
} from '../application-server/services/task-instance-application-service';
import {
  TaskTemplateApplicationService,
} from '../application-server/services/task-template-application-service';
import {
  TaskDependencyApplicationService,
} from '../application-server/services/task-dependency-application-service';
import {
  TaskStatisticsApplicationService,
} from '../application-server/services/task-statistics-application-service';
import { ScheduleTaskPrismaRepository } from '../schedule/adapters/prisma';
import { SqliteScheduleTaskRepository } from '../schedule/adapters/sqlite';

// Type alias for better SQLite3 database instance
type BetterSQLiteDB = Database.Database;

/**
 * Task Module
 *
 * Composition Root for Task domain
 * Supports both Prisma (API) and SQLite (Desktop) data sources
 *
 * 用法:
 * const taskModule = new TaskModule('prisma', prismaClient);
 * // or
 * const taskModule = new TaskModule('sqlite', sqliteDb);
 *
 * // Use services
 * await taskModule.taskInstanceService.create(data);
 */
export class TaskModule {
  public readonly taskInstanceRepository: ITaskInstanceRepository;
  public readonly taskDependencyRepository: ITaskDependencyRepository;
  public readonly taskStatisticsRepository: ITaskStatisticsRepository;
  public readonly scheduleTaskRepository: any; // ScheduleRepository

  public readonly taskInstanceService: TaskInstanceApplicationService;
  public readonly taskTemplateService: TaskTemplateApplicationService;
  public readonly taskDependencyService: TaskDependencyApplicationService;
  public readonly taskStatisticsService: TaskStatisticsApplicationService;

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // 1. Initialize Repositories using Factory
    this.taskInstanceRepository = TaskRepositoryFactory.createTaskInstanceRepository(
      dataSourceType,
      dbConnection,
    );
    this.taskDependencyRepository = TaskRepositoryFactory.createTaskDependencyRepository(
      dataSourceType,
      dbConnection,
    );
    this.taskStatisticsRepository = TaskRepositoryFactory.createTaskStatisticsRepository(
      dataSourceType,
      dbConnection,
    );

    // 2. Initialize Schedule Repository (special handling)
    if (dataSourceType === 'prisma') {
      this.scheduleTaskRepository = new ScheduleTaskPrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      this.scheduleTaskRepository = new SqliteScheduleTaskRepository(dbConnection as BetterSQLiteDB);
    } else {
      throw new Error(`Unknown data source type: ${dataSourceType}`);
    }

    // 3. Initialize Services (Pure DI)
    this.taskTemplateService = new TaskTemplateApplicationService(
      this.taskInstanceRepository as any,
      this.taskInstanceRepository,
      this.scheduleTaskRepository as any,
    );

    this.taskInstanceService = new TaskInstanceApplicationService(
      this.taskInstanceRepository,
      this.taskInstanceRepository as any,
    );

    this.taskDependencyService = new TaskDependencyApplicationService(
      this.taskDependencyRepository,
      this.taskInstanceRepository as any,
    );

    this.taskStatisticsService = new TaskStatisticsApplicationService(
      this.taskStatisticsRepository,
      this.taskInstanceRepository as any,
      this.taskInstanceRepository,
    );
  }
}
