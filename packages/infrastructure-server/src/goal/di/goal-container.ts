import type {
  IGoalRepository,
  IGoalFolderRepository,
  IFocusSessionRepository,
  IGoalStatisticsRepository,
  IFocusModeRepository,
} from '@dailyuse/domain-server/goal';
import { PrismaGoalRepository } from '../repositories/PrismaGoalRepository';
import { PrismaFocusSessionRepository } from '../repositories/PrismaFocusSessionRepository';
import { PrismaGoalStatisticsRepository } from '../repositories/PrismaGoalStatisticsRepository';
import { PrismaGoalFolderRepository } from '../repositories/PrismaGoalFolderRepository';
import { PrismaFocusModeRepository } from '../repositories/PrismaFocusModeRepository';
import { prisma } from '@/shared/infrastructure/config/prisma';

/**
 * Goal 模块依赖注入容器
 * 负责管理领域服务和仓储的实例创建和生命周期
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 仓储用于单元测试
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository?: IGoalRepository;
  private goalFolderRepository?: IGoalFolderRepository;
  private focusSessionRepository?: IFocusSessionRepository;
  private focusModeRepository?: IFocusModeRepository;
  private goalStatisticsRepository?: IGoalStatisticsRepository;

  private constructor() {}

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * 获取目标仓储实例（懒加载）
   */
  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      this.goalRepository = new PrismaGoalRepository(prisma);
    }
    return this.goalRepository;
  }

  /**
   * 设置目标仓储实例（用于测试）
   */
  setGoalRepository(repository: IGoalRepository): void {
    this.goalRepository = repository;
  }

  /**
   * 获取文件夹仓储实例（懒加载）
   */
  getGoalFolderRepository(): IGoalFolderRepository {
    if (!this.goalFolderRepository) {
      this.goalFolderRepository = new PrismaGoalFolderRepository(prisma);
    }
    return this.goalFolderRepository;
  }

  /**
   * 设置文件夹仓储实例（用于测试）
   */
  setGoalFolderRepository(repository: IGoalFolderRepository): void {
    this.goalFolderRepository = repository;
  }

  /**
   * 获取专注周期仓储实例（懒加载）
   */
  getFocusSessionRepository(): IFocusSessionRepository {
    if (!this.focusSessionRepository) {
      this.focusSessionRepository = new PrismaFocusSessionRepository(prisma);
    }
    return this.focusSessionRepository;
  }

  /**
   * 设置专注周期仓储实例（用于测试）
   */
  setFocusSessionRepository(repository: IFocusSessionRepository): void {
    this.focusSessionRepository = repository;
  }

  /**
   * 获取专注模式仓储实例（懒加载）
   */
  getFocusModeRepository(): IFocusModeRepository {
    if (!this.focusModeRepository) {
      this.focusModeRepository = new PrismaFocusModeRepository(prisma);
    }
    return this.focusModeRepository;
  }

  /**
   * 设置专注模式仓储实例（用于测试）
   */
  setFocusModeRepository(repository: IFocusModeRepository): void {
    this.focusModeRepository = repository;
  }

  /**
   * 获取目标统计仓储实例（懒加载）
   */
  getGoalStatisticsRepository(): IGoalStatisticsRepository {
    if (!this.goalStatisticsRepository) {
      this.goalStatisticsRepository = new PrismaGoalStatisticsRepository(prisma);
    }
    return this.goalStatisticsRepository;
  }

  /**
   * 设置目标统计仓储实例（用于测试）
   */
  setGoalStatisticsRepository(repository: IGoalStatisticsRepository): void {
    this.goalStatisticsRepository = repository;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.goalRepository = undefined;
    this.goalFolderRepository = undefined;
    this.focusSessionRepository = undefined;
    this.focusModeRepository = undefined;
    this.goalStatisticsRepository = undefined;
  }
}
