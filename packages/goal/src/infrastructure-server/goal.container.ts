/**
 * Goal Container (Server)
 *
 * 渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞?Goal 妯″潡鐨?repository 瀹炰緥
 */

import type { IGoalRepository, IGoalStatisticsRepository, IGoalFolderRepository } from '@/domain-server';

/**
 * Goal 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository: IGoalRepository | null = null;
  private statisticsRepository: IGoalStatisticsRepository | null = null;
  private goalFolderRepository: IGoalFolderRepository | null = null;

  private constructor() {}

  /**
   * Get瀹瑰櫒鍗曚緥
   */
  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級
   */
  static resetInstance(): void {
    GoalContainer.instance = new GoalContainer();
  }

  /**
   * 娉ㄥ唽 GoalRepository
   */
  registerGoalRepository(repository: IGoalRepository): this {
    this.goalRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 GoalStatisticsRepository
   */
  registerStatisticsRepository(repository: IGoalStatisticsRepository): this {
    this.statisticsRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 GoalFolderRepository
   */
  registerGoalFolderRepository(repository: IGoalFolderRepository): this {
    this.goalFolderRepository = repository;
    return this;
  }

  /**
   * Get GoalRepository
   */
  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      throw new Error('GoalRepository not registered. Call registerGoalRepository first.');
    }
    return this.goalRepository;
  }

  /**
   * Get GoalStatisticsRepository
   */
  getStatisticsRepository(): IGoalStatisticsRepository {
    if (!this.statisticsRepository) {
      throw new Error('GoalStatisticsRepository not registered. Call registerStatisticsRepository first.');
    }
    return this.statisticsRepository;
  }

  /**
   * Get GoalFolderRepository
   */
  getGoalFolderRepository(): IGoalFolderRepository {
    if (!this.goalFolderRepository) {
      throw new Error('GoalFolderRepository not registered. Call registerGoalFolderRepository first.');
    }
    return this.goalFolderRepository;
  }

  /**
   * 妫€鏌ユ槸鍚﹀凡閰嶇疆
   */
  isConfigured(): boolean {
    return this.goalRepository !== null;
  }

  /**
   * 娓呯┖All鏈夋敞鍐岀殑渚濊禆
   */
  clear(): void {
    this.goalRepository = null;
    this.statisticsRepository = null;
    this.goalFolderRepository = null;
  }
}
