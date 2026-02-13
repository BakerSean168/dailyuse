/**
 * Task Module DI Container
 * 任务模块依赖注入容器
 *
 * 管理 Task 仓储实例（单例模式）
 * 支持 Prisma 和 SQLite 数据源
 */

import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskDependencyRepository } from '../../domain-server/repositories/ITaskDependencyRepository';
import type { ITaskFolderRepository } from '../../domain-server/repositories/ITaskFolderRepository';

export class TaskContainer {
  private static instance: TaskContainer;
  private taskTemplateRepository?: ITaskTemplateRepository;
  private taskInstanceRepository?: ITaskInstanceRepository;
  private taskDependencyRepository?: ITaskDependencyRepository;
  private taskFolderRepository?: ITaskFolderRepository;

  private constructor() {}

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  // ============ Getters ============

  getTaskTemplateRepository(): ITaskTemplateRepository {
    if (!this.taskTemplateRepository) {
      throw new Error('TaskTemplateRepository not registered in TaskContainer');
    }
    return this.taskTemplateRepository;
  }

  getTaskInstanceRepository(): ITaskInstanceRepository {
    if (!this.taskInstanceRepository) {
      throw new Error('TaskInstanceRepository not registered in TaskContainer');
    }
    return this.taskInstanceRepository;
  }

  getTaskDependencyRepository(): ITaskDependencyRepository {
    if (!this.taskDependencyRepository) {
      throw new Error('TaskDependencyRepository not registered in TaskContainer');
    }
    return this.taskDependencyRepository;
  }

  getTaskFolderRepository(): ITaskFolderRepository {
    if (!this.taskFolderRepository) {
      throw new Error('TaskFolderRepository not registered in TaskContainer');
    }
    return this.taskFolderRepository;
  }

  // ============ Setters (Registration) ============

  setTaskTemplateRepository(repository: ITaskTemplateRepository): void {
    this.taskTemplateRepository = repository;
  }

  setTaskInstanceRepository(repository: ITaskInstanceRepository): void {
    this.taskInstanceRepository = repository;
  }

  setTaskDependencyRepository(repository: ITaskDependencyRepository): void {
    this.taskDependencyRepository = repository;
  }

  setTaskFolderRepository(repository: ITaskFolderRepository): void {
    this.taskFolderRepository = repository;
  }

  // ============ Reset (Testing) ============

  reset(): void {
    this.taskTemplateRepository = undefined;
    this.taskInstanceRepository = undefined;
    this.taskDependencyRepository = undefined;
    this.taskFolderRepository = undefined;
  }
}