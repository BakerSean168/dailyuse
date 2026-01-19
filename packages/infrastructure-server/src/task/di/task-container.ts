import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
  ITaskDependencyRepository,
  ITaskStatisticsRepository,
} from '@dailyuse/domain-server/task';
import { TaskDependencyService } from '@dailyuse/domain-server/task';
import { PrismaTaskInstanceRepository } from '../repositories/PrismaTaskInstanceRepository';
import { PrismaTaskTemplateRepository } from '../repositories/PrismaTaskTemplateRepository';
import { PrismaTaskDependencyRepository } from '../repositories/PrismaTaskDependencyRepository';
import { PrismaTaskStatisticsRepository } from '../repositories/PrismaTaskStatisticsRepository';
import { prisma } from '@/shared/infrastructure/config/prisma';

/**
 * Task Module DI Container
 * 管理 Task 模块的所有仓储实例
 */
export class TaskContainer {
  private static instance: TaskContainer;
  private taskInstanceRepository: ITaskInstanceRepository | null = null;
  private taskTemplateRepository: ITaskTemplateRepository | null = null;
  private taskDependencyRepository: ITaskDependencyRepository | null = null;
  private taskStatisticsRepository: ITaskStatisticsRepository | null = null;
  private taskDependencyService: TaskDependencyService | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * 获取 TaskInstance 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getTaskInstanceRepository(): ITaskInstanceRepository {
    if (!this.taskInstanceRepository) {
      this.taskInstanceRepository = new PrismaTaskInstanceRepository(prisma);
    }
    return this.taskInstanceRepository!;
  }

  /**
   * 设置 TaskInstance 仓储（用于测试）
   */
  setTaskInstanceRepository(repository: ITaskInstanceRepository): void {
    this.taskInstanceRepository = repository;
  }

  /**
   * 获取 TaskTemplate 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getTaskTemplateRepository(): ITaskTemplateRepository {
    if (!this.taskTemplateRepository) {
      this.taskTemplateRepository = new PrismaTaskTemplateRepository(prisma);
    }
    return this.taskTemplateRepository!;
  }

  /**
   * 设置 TaskTemplate 仓储（用于测试）
   */
  setTaskTemplateRepository(repository: ITaskTemplateRepository): void {
    this.taskTemplateRepository = repository;
  }

  /**
   * 获取 TaskDependency 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getTaskDependencyRepository(): ITaskDependencyRepository {
    if (!this.taskDependencyRepository) {
      this.taskDependencyRepository = new PrismaTaskDependencyRepository(prisma);
    }
    return this.taskDependencyRepository!;
  }

  /**
   * 设置 TaskDependency 仓储（用于测试）
   */
  setTaskDependencyRepository(repository: ITaskDependencyRepository): void {
    this.taskDependencyRepository = repository;
  }

  /**
   * 获取 TaskDependency 领域服务
   * 使用懒加载，第一次访问时创建实例
   */
  getTaskDependencyService(): TaskDependencyService {
    if (!this.taskDependencyService) {
      this.taskDependencyService = new TaskDependencyService();
    }
    return this.taskDependencyService!;
  }

  /**
   * 设置 TaskDependency 领域服务（用于测试）
   */
  setTaskDependencyService(service: TaskDependencyService): void {
    this.taskDependencyService = service;
  }

  /**
   * 获取 TaskStatistics 仓储
   * 使用懒加载，第一次访问时创建实例
   */
  getTaskStatisticsRepository(): ITaskStatisticsRepository {
    if (!this.taskStatisticsRepository) {
      this.taskStatisticsRepository = new PrismaTaskStatisticsRepository(prisma);
    }
    return this.taskStatisticsRepository!;
  }

  /**
   * 设置 TaskStatistics 仓储（用于测试）
   */
  setTaskStatisticsRepository(repository: ITaskStatisticsRepository): void {
    this.taskStatisticsRepository = repository;
  }
}
