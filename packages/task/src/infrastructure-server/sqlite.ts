/**
 * Task Module - SQLite Composition Root
 *
 * SQLite-only wiring to avoid Prisma imports in desktop.
 */

import type Database from 'better-sqlite3';
import type { ITaskTemplateRepository } from '../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskDependencyRepository } from '../domain-server/repositories/ITaskDependencyRepository';
import type { ITaskFolderRepository } from '../domain-server/repositories/ITaskFolderRepository';
import { TaskContainer } from './di/task-container';
import { SqliteTaskTemplateRepository } from './adapters/sqlite/task-template-sqlite.repository';
import { SqliteTaskInstanceRepository } from './adapters/sqlite/task-instance-sqlite.repository';
import { SqliteTaskDependencyRepository } from './adapters/sqlite/task-dependency-sqlite.repository';
import { SqliteTaskFolderRepository } from './adapters/sqlite/task-folder-sqlite.repository';
import { CreateTaskTemplate } from '../application-server/use-cases/commands/create-task-template';
import { GetTaskTemplate } from '../application-server/use-cases/queries/get-task-template';
import { ListTaskTemplates } from '../application-server/use-cases/queries/list-task-templates';
import { UpdateTaskTemplate } from '../application-server/use-cases/commands/update-task-template';
import { ActivateTaskTemplate } from '../application-server/use-cases/commands/activate-task-template';
import { PauseTaskTemplate } from '../application-server/use-cases/commands/pause-task-template';
import { ArchiveTaskTemplate } from '../application-server/use-cases/commands/archive-task-template';
import { DeleteTaskTemplate } from '../application-server/use-cases/commands/delete-task-template';
import { CompleteTaskInstance } from '../application-server/use-cases/commands/complete-task-instance';
import { SkipTaskInstance } from '../application-server/use-cases/commands/skip-task-instance';
import { GetTaskInstancesByDateRange } from '../application-server/use-cases/queries/get-task-instances-by-date-range';
import { GetTaskInstance } from '../application-server/use-cases/queries/get-task-instance';
import { ListTaskInstancesByAccount } from '../application-server/use-cases/queries/list-task-instances-by-account';
import { ListTaskInstancesByTemplate } from '../application-server/use-cases/queries/list-task-instances-by-template';
import { ListTaskInstancesByStatus } from '../application-server/use-cases/queries/list-task-instances-by-status';
import { StartTaskInstance } from '../application-server/use-cases/commands/start-task-instance';
import { DeleteTaskInstance } from '../application-server/use-cases/commands/delete-task-instance';
import { GenerateTaskInstances } from '../application-server/use-cases/commands/generate-task-instances';
import { BindTaskToGoal } from '../application-server/use-cases/commands/bind-task-to-goal';
import { UnbindTaskFromGoal } from '../application-server/use-cases/commands/unbind-task-from-goal';
import { CheckExpiredInstances } from '../application-server/use-cases/commands/check-expired-instances';
import { CreateTaskDependency } from '../application-server/use-cases/commands/create-task-dependency';
import { DeleteTaskDependency } from '../application-server/use-cases/commands/delete-task-dependency';
import { UpdateTaskDependency } from '../application-server/use-cases/commands/update-task-dependency';
import { ListTaskTemplatesByPriority } from '../application-server/use-cases/queries/list-task-templates-by-priority';
import { ListTaskDependencies } from '../application-server/use-cases/queries/list-task-dependencies';
import { GetDependencyChain } from '../application-server/use-cases/queries/get-dependency-chain';
import { ValidateTaskDependency } from '../application-server/use-cases/queries/validate-task-dependency';

type BetterSQLiteDB = Database.Database;

export class TaskSqliteModule {
  public readonly taskTemplateRepository: ITaskTemplateRepository;
  public readonly taskInstanceRepository: ITaskInstanceRepository;
  public readonly taskDependencyRepository: ITaskDependencyRepository;
  public readonly taskFolderRepository?: ITaskFolderRepository;

  public readonly createTaskTemplate: CreateTaskTemplate;
  public readonly getTaskTemplate: GetTaskTemplate;
  public readonly listTaskTemplates: ListTaskTemplates;
  public readonly updateTaskTemplate: UpdateTaskTemplate;
  public readonly activateTaskTemplate: ActivateTaskTemplate;
  public readonly pauseTaskTemplate: PauseTaskTemplate;
  public readonly archiveTaskTemplate: ArchiveTaskTemplate;
  public readonly deleteTaskTemplate: DeleteTaskTemplate;
  public readonly getTaskInstance: GetTaskInstance;
  public readonly listTaskInstancesByAccount: ListTaskInstancesByAccount;
  public readonly listTaskInstancesByTemplate: ListTaskInstancesByTemplate;
  public readonly listTaskInstancesByStatus: ListTaskInstancesByStatus;
  public readonly getTaskInstancesByDateRange: GetTaskInstancesByDateRange;
  public readonly completeTaskInstance: CompleteTaskInstance;
  public readonly skipTaskInstance: SkipTaskInstance;
  public readonly startTaskInstance: StartTaskInstance;
  public readonly deleteTaskInstance: DeleteTaskInstance;
  public readonly generateTaskInstances: GenerateTaskInstances;
  public readonly bindTaskToGoal: BindTaskToGoal;
  public readonly unbindTaskFromGoal: UnbindTaskFromGoal;
  public readonly checkExpiredInstances: CheckExpiredInstances;
  public readonly listTaskTemplatesByPriority: ListTaskTemplatesByPriority;
  public readonly createTaskDependency: CreateTaskDependency;
  public readonly deleteTaskDependency: DeleteTaskDependency;
  public readonly updateTaskDependency: UpdateTaskDependency;
  public readonly listTaskDependencies: ListTaskDependencies;
  public readonly getDependencyChain: GetDependencyChain;
  public readonly validateTaskDependency: ValidateTaskDependency;

  constructor(dbConnection: BetterSQLiteDB) {
    const taskTemplateRepository = new SqliteTaskTemplateRepository(dbConnection);
    const taskInstanceRepository = new SqliteTaskInstanceRepository(dbConnection);
    const taskDependencyRepository = new SqliteTaskDependencyRepository(dbConnection);
    const taskFolderRepository = new SqliteTaskFolderRepository(dbConnection);

    const container = TaskContainer.getInstance();
    container.reset();
    container.setTaskTemplateRepository(taskTemplateRepository);
    container.setTaskInstanceRepository(taskInstanceRepository);
    container.setTaskDependencyRepository(taskDependencyRepository);
    container.setTaskFolderRepository(taskFolderRepository);

    this.taskTemplateRepository = container.getTaskTemplateRepository();
    this.taskInstanceRepository = container.getTaskInstanceRepository();
    this.taskDependencyRepository = container.getTaskDependencyRepository();
    this.taskFolderRepository = taskFolderRepository;

    this.createTaskTemplate = new CreateTaskTemplate(
      this.taskTemplateRepository,
      this.taskInstanceRepository,
    );
    this.getTaskTemplate = new GetTaskTemplate(this.taskTemplateRepository);
    this.listTaskTemplates = new ListTaskTemplates(
      this.taskTemplateRepository,
      this.taskInstanceRepository,
    );
    this.updateTaskTemplate = new UpdateTaskTemplate(this.taskTemplateRepository);
    this.activateTaskTemplate = new ActivateTaskTemplate(
      this.taskTemplateRepository,
      this.taskInstanceRepository,
    );
    this.pauseTaskTemplate = new PauseTaskTemplate(
      this.taskTemplateRepository,
      this.taskInstanceRepository,
    );
    this.archiveTaskTemplate = new ArchiveTaskTemplate(this.taskTemplateRepository);
    this.deleteTaskTemplate = new DeleteTaskTemplate(this.taskTemplateRepository);

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
    this.generateTaskInstances = new GenerateTaskInstances(
      this.taskTemplateRepository,
      this.taskInstanceRepository,
    );
    this.bindTaskToGoal = new BindTaskToGoal(this.taskTemplateRepository);
    this.unbindTaskFromGoal = new UnbindTaskFromGoal(this.taskTemplateRepository);
    this.checkExpiredInstances = new CheckExpiredInstances(this.taskInstanceRepository);
    this.listTaskTemplatesByPriority = new ListTaskTemplatesByPriority(this.taskTemplateRepository);
    this.createTaskDependency = new CreateTaskDependency(this.taskDependencyRepository);
    this.deleteTaskDependency = new DeleteTaskDependency(this.taskDependencyRepository);
    this.updateTaskDependency = new UpdateTaskDependency(this.taskDependencyRepository);
    this.listTaskDependencies = new ListTaskDependencies(this.taskDependencyRepository);
    this.getDependencyChain = new GetDependencyChain(this.taskDependencyRepository);
    this.validateTaskDependency = new ValidateTaskDependency(this.taskDependencyRepository);
  }
}

export {
  SqliteTaskTemplateRepository,
  SqliteTaskInstanceRepository,
  SqliteTaskDependencyRepository,
  SqliteTaskFolderRepository,
  TaskContainer,
};
