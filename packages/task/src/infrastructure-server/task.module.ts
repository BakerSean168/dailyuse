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
import { CompleteTaskInstance } from '../application-server/services/complete-task-instance';
import { SkipTaskInstance } from '../application-server/services/skip-task-instance';
import { GetTaskInstancesByDateRange } from '../application-server/services/get-task-instances-by-date-range';
import { GetTaskInstance } from '../application-server/services/get-task-instance';
import { ListTaskInstancesByAccount } from '../application-server/services/list-task-instances-by-account';
import { ListTaskInstancesByTemplate } from '../application-server/services/list-task-instances-by-template';
import { ListTaskInstancesByStatus } from '../application-server/services/list-task-instances-by-status';
import { StartTaskInstance } from '../application-server/services/start-task-instance';
import { DeleteTaskInstance } from '../application-server/services/delete-task-instance';

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
  public readonly getTaskInstance: GetTaskInstance;
  public readonly listTaskInstancesByAccount: ListTaskInstancesByAccount;
  public readonly listTaskInstancesByTemplate: ListTaskInstancesByTemplate;
  public readonly listTaskInstancesByStatus: ListTaskInstancesByStatus;
  public readonly getTaskInstancesByDateRange: GetTaskInstancesByDateRange;
  public readonly completeTaskInstance: CompleteTaskInstance;
  public readonly skipTaskInstance: SkipTaskInstance;
  public readonly startTaskInstance: StartTaskInstance;
  public readonly deleteTaskInstance: DeleteTaskInstance;

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

    this.getTaskInstance = new GetTaskInstance(this.taskInstanceRepository);
    this.listTaskInstancesByAccount = new ListTaskInstancesByAccount(this.taskInstanceRepository);
    this.listTaskInstancesByTemplate = new ListTaskInstancesByTemplate(this.taskInstanceRepository);
    this.listTaskInstancesByStatus = new ListTaskInstancesByStatus(this.taskInstanceRepository);
    this.getTaskInstancesByDateRange = new GetTaskInstancesByDateRange(this.taskInstanceRepository);
    this.completeTaskInstance = new CompleteTaskInstance(
      this.taskInstanceRepository,
      this.taskTemplateRepository,
    );
    this.skipTaskInstance = new SkipTaskInstance(this.taskInstanceRepository);
    this.startTaskInstance = new StartTaskInstance(this.taskInstanceRepository);
    this.deleteTaskInstance = new DeleteTaskInstance(this.taskInstanceRepository);
  }
}