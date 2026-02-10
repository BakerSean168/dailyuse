import type { ITaskInstanceRepository, ITaskDependencyRepository, ITaskStatisticsRepository } from '@/domain-server';
import { DataSourceManager } from '../../shared/config/data-source-manager';
import { TaskRepositoryFactory } from './task-repository.factory';
import { prisma } from '../../shared/config/prisma';

/**
 * Task Module DI Container
 *
 * Manages Task repository instances with Singleton pattern
 * Supports both Prisma and SQLite data sources
 *
 * 用法:
 * const container = TaskContainer.getInstance();
 * const taskInstanceRepo = container.getTaskInstanceRepository();
 */
export class TaskContainer {
  private static instance: TaskContainer;
  private taskInstanceRepository?: ITaskInstanceRepository;
  private taskDependencyRepository?: ITaskDependencyRepository;
  private taskStatisticsRepository?: ITaskStatisticsRepository;

  private constructor() {}

  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * Get TaskInstanceRepository (lazy load with caching)
   * Automatically selects Prisma or SQLite based on DataSourceManager
   */
  getTaskInstanceRepository(): ITaskInstanceRepository {
    if (!this.taskInstanceRepository) {
      const dsManager = DataSourceManager.getInstance();

      if (dsManager.isPrisma()) {
        this.taskInstanceRepository = TaskRepositoryFactory.createTaskInstanceRepository(
          'prisma',
          prisma,
        );
      } else if (dsManager.isSQLite()) {
        this.taskInstanceRepository = TaskRepositoryFactory.createTaskInstanceRepository(
          'sqlite',
          dsManager.getSQLiteDb(),
        );
      } else {
        throw new Error('Unknown data source type in TaskContainer');
      }
    }
    return this.taskInstanceRepository;
  }

  /**
   * Get TaskDependencyRepository (lazy load with caching)
   */
  getTaskDependencyRepository(): ITaskDependencyRepository {
    if (!this.taskDependencyRepository) {
      const dsManager = DataSourceManager.getInstance();

      if (dsManager.isPrisma()) {
        this.taskDependencyRepository = TaskRepositoryFactory.createTaskDependencyRepository(
          'prisma',
          prisma,
        );
      } else if (dsManager.isSQLite()) {
        this.taskDependencyRepository = TaskRepositoryFactory.createTaskDependencyRepository(
          'sqlite',
          dsManager.getSQLiteDb(),
        );
      } else {
        throw new Error('Unknown data source type in TaskContainer');
      }
    }
    return this.taskDependencyRepository;
  }

  /**
   * Get TaskStatisticsRepository (lazy load with caching)
   */
  getTaskStatisticsRepository(): ITaskStatisticsRepository {
    if (!this.taskStatisticsRepository) {
      const dsManager = DataSourceManager.getInstance();

      if (dsManager.isPrisma()) {
        this.taskStatisticsRepository = TaskRepositoryFactory.createTaskStatisticsRepository(
          'prisma',
          prisma,
        );
      } else if (dsManager.isSQLite()) {
        this.taskStatisticsRepository = TaskRepositoryFactory.createTaskStatisticsRepository(
          'sqlite',
          dsManager.getSQLiteDb(),
        );
      } else {
        throw new Error('Unknown data source type in TaskContainer');
      }
    }
    return this.taskStatisticsRepository;
  }

  /**
   * Set repositories (for testing)
   */
  setTaskInstanceRepository(repository: ITaskInstanceRepository): void {
    this.taskInstanceRepository = repository;
  }

  setTaskDependencyRepository(repository: ITaskDependencyRepository): void {
    this.taskDependencyRepository = repository;
  }

  setTaskStatisticsRepository(repository: ITaskStatisticsRepository): void {
    this.taskStatisticsRepository = repository;
  }

  /**
   * Reset container (for testing)
   */
  reset(): void {
    this.taskInstanceRepository = undefined;
    this.taskDependencyRepository = undefined;
    this.taskStatisticsRepository = undefined;
  }
}
