/**
 * Goal Container (Server)
 *
 * 依赖注入容器，管�?Goal 模块�?repository 实例
 */

import type { IGoalRepository, IGoalStatisticsRepository, IGoalFolderRepository } from '@dailyuse/domain-server/goal';

/**
 * Goal 模块依赖注入容器
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository: IGoalRepository | null = null;
  private statisticsRepository: IGoalStatisticsRepository | null = null;
  private goalFolderRepository: IGoalFolderRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    GoalContainer.instance = new GoalContainer();
  }

  /**
   * 注册 GoalRepository
   */
  registerGoalRepository(repository: IGoalRepository): this {
    this.goalRepository = repository;
    return this;
  }

  /**
   * 注册 GoalStatisticsRepository
   */
  registerStatisticsRepository(repository: IGoalStatisticsRepository): this {
    this.statisticsRepository = repository;
    return this;
  }

  /**
   * 注册 GoalFolderRepository
   */
  registerGoalFolderRepository(repository: IGoalFolderRepository): this {
    this.goalFolderRepository = repository;
    return this;
  }

  /**
   * 获取 GoalRepository
   */
  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      throw new Error('GoalRepository not registered. Call registerGoalRepository first.');
    }
    return this.goalRepository;
  }

  /**
   * 获取 GoalStatisticsRepository
   */
  getStatisticsRepository(): IGoalStatisticsRepository {
    if (!this.statisticsRepository) {
      throw new Error('GoalStatisticsRepository not registered. Call registerStatisticsRepository first.');
    }
    return this.statisticsRepository;
  }

  /**
   * 获取 GoalFolderRepository
   */
  getGoalFolderRepository(): IGoalFolderRepository {
    if (!this.goalFolderRepository) {
      throw new Error('GoalFolderRepository not registered. Call registerGoalFolderRepository first.');
    }
    return this.goalFolderRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.goalRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.goalRepository = null;
    this.statisticsRepository = null;
    this.goalFolderRepository = null;
  }
}
