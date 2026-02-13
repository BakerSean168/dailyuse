/**
 * Task Module - Composition Root
 * 任务模块组合根
 *
 * 负责初始化仓储和应用服务
 * 支持 Prisma (API) 和 SQLite (Desktop) 数据源
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import type { ITaskTemplateRepository } from '../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskDependencyRepository } from '../domain-server/repositories/ITaskDependencyRepository';
import type { ITaskFolderRepository } from '../domain-server/repositories/ITaskFolderRepository';
import { TaskRepositoryFactory } from './di/task-repository.factory';
import { TaskTemplateApplicationService } from '../application-server/services/task-template-application-service';
import { TaskInstanceApplicationService } from '../application-server/services/task-instance-application-service';
import { TaskDependencyApplicationService } from '../application-server/services/task-dependency-application-service';

type BetterSQLiteDB = Database.Database;

/**
 * Task Module
 * Composition Root for Task domain
 */
export class TaskModule {
  public readonly taskTemplateRepository: ITaskTemplateRepository;
  public readonly taskInstanceRepository: ITaskInstanceRepository;
  public readonly taskDependencyRepository: ITaskDependencyRepository;
  public readonly taskFolderRepository?: ITaskFolderRepository;

  public readonly taskTemplateService: TaskTemplateApplicationService;
  public readonly taskInstanceService: TaskInstanceApplicationService;
  public readonly taskDependencyService: TaskDependencyApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories
    this.taskTemplateRepository = TaskRepositoryFactory.createTaskTemplateRepository(
      dataSourceType,
      dbConnection,
    );
    this.taskInstanceRepository = TaskRepositoryFactory.createTaskInstanceRepository(
      dataSourceType,
      dbConnection,
    );
    this.taskDependencyRepository = TaskRepositoryFactory.createTaskDependencyRepository(
      dataSourceType,
      dbConnection,
    );

    if (dataSourceType === 'prisma') {
      this.taskFolderRepository = TaskRepositoryFactory.createTaskFolderRepository(
        dataSourceType,
        dbConnection,
      );
    }

    // 2. Initialize Application Services (Pure DI)
    this.taskTemplateService = new TaskTemplateApplicationService(
      this.taskTemplateRepository,
      this.taskInstanceRepository,
    );

    this.taskInstanceService = new TaskInstanceApplicationService(
      this.taskInstanceRepository,
      this.taskTemplateRepository,
    );

    this.taskDependencyService = new TaskDependencyApplicationService(
      this.taskDependencyRepository,
      this.taskTemplateRepository,
    );
  }
}