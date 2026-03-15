/**
 * TaskContainer — legacy singleton DI container.
 * TaskContainer —— 遗留单例依赖注入容器。
 *
 * Manages Task repository bindings (singleton pattern).
 * 管理 Task 仓储实例（单例模式）。
 * Supports Prisma and SQLite data sources.
 * 支持 Prisma 和 SQLite 数据源。
 *
 * @deprecated The task module no longer uses this container internally.
 *             It is kept only for backward compatibility with older callers.
 * @deprecated Task 模块内部已不再使用该容器；当前仅为兼容旧调用方保留。
 *
 * @see {@link createTaskModule} Use the composition root factory for dependency injection.
 * @see {@link createTaskModule} 使用组合根工厂进行依赖注入。
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
