import type {
  IGoalRepository,
  IGoalFolderRepository,
  IFocusSessionRepository,
  IGoalStatisticsRepository,
  IFocusModeRepository,
  IWeightSnapshotRepository
} from '@dailyuse/domain-server/goal';
import { 
  PrismaGoalRepository,
  PrismaFocusSessionRepository,
  PrismaGoalStatisticsRepository,
  PrismaGoalFolderRepository,
  PrismaFocusModeRepository,
  PrismaWeightSnapshotRepository
} from '@dailyuse/infrastructure-server/goal';
import {
  GoalApplicationService,
  GoalFolderApplicationService,
  GoalStatisticsApplicationService,
  FocusSessionApplicationService,
  FocusModeApplicationService,
  GoalKeyResultApplicationService,
  GoalRecordApplicationService,
  GoalReviewApplicationService,
  WeightSnapshotApplicationService
} from '@dailyuse/application-server/goal';
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
  private weightSnapshotRepository?: IWeightSnapshotRepository;

  private goalService?: GoalApplicationService;
  private goalFolderService?: GoalFolderApplicationService;
  private goalStatisticsService?: GoalStatisticsApplicationService;
  private focusSessionService?: FocusSessionApplicationService;
  private focusModeService?: FocusModeApplicationService;
  private goalKeyResultService?: GoalKeyResultApplicationService;
  private goalRecordService?: GoalRecordApplicationService;
  private goalReviewService?: GoalReviewApplicationService;
  private weightSnapshotService?: WeightSnapshotApplicationService;

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
   * 获取权重快照仓储实例（懒加载）
   */
  getWeightSnapshotRepository(): IWeightSnapshotRepository {
    if (!this.weightSnapshotRepository) {
      this.weightSnapshotRepository = new PrismaWeightSnapshotRepository(prisma);
    }
    return this.weightSnapshotRepository;
  }

  /**
   * 设置权重快照仓储实例（用于测试）
   */
  setWeightSnapshotRepository(repository: IWeightSnapshotRepository): void {
    this.weightSnapshotRepository = repository;
  }

  /**
   * 获取目标应用服务实例
   */
  getGoalApplicationService(): GoalApplicationService {
    if (!this.goalService) {
      this.goalService = new GoalApplicationService(this.getGoalRepository());
    }
    return this.goalService;
  }

  /**
   * 获取目标文件夹应用服务实例
   */
  getGoalFolderApplicationService(): GoalFolderApplicationService {
    if (!this.goalFolderService) {
      this.goalFolderService = new GoalFolderApplicationService(
        this.getGoalFolderRepository(),
        this.getGoalRepository()
      );
    }
    return this.goalFolderService;
  }

  /**
   * 获取目标统计应用服务实例
   */
  getGoalStatisticsApplicationService(): GoalStatisticsApplicationService {
    if (!this.goalStatisticsService) {
      this.goalStatisticsService = new GoalStatisticsApplicationService(
        this.getGoalStatisticsRepository(),
        this.getGoalRepository()
      );
    }
    return this.goalStatisticsService;
  }

  /**
   * 获取专注周期应用服务实例
   */
  getFocusSessionApplicationService(): FocusSessionApplicationService {
    if (!this.focusSessionService) {
      this.focusSessionService = new FocusSessionApplicationService(
        this.getFocusSessionRepository(),
        this.getGoalRepository()
      );
    }
    return this.focusSessionService;
  }

  /**
   * 获取专注模式应用服务实例
   */
  getFocusModeApplicationService(): FocusModeApplicationService {
    if (!this.focusModeService) {
      this.focusModeService = new FocusModeApplicationService(
        this.getFocusModeRepository(),
        this.getGoalRepository()
      );
    }
    return this.focusModeService;
  }

  /**
   * 获取目标关键结果应用服务实例
   */
  getGoalKeyResultApplicationService(): GoalKeyResultApplicationService {
    if (!this.goalKeyResultService) {
      this.goalKeyResultService = new GoalKeyResultApplicationService(this.getGoalRepository());
    }
    return this.goalKeyResultService;
  }

  /**
   * 获取目标记录应用服务实例
   */
  getGoalRecordApplicationService(): GoalRecordApplicationService {
    if (!this.goalRecordService) {
      this.goalRecordService = new GoalRecordApplicationService(this.getGoalRepository());
    }
    return this.goalRecordService;
  }

  /**
   * 获取目标回顾应用服务实例
   */
  getGoalReviewApplicationService(): GoalReviewApplicationService {
    if (!this.goalReviewService) {
      this.goalReviewService = new GoalReviewApplicationService(this.getGoalRepository());
    }
    return this.goalReviewService;
  }

  /**
   * 获取权重快照应用服务实例
   */
  getWeightSnapshotApplicationService(): WeightSnapshotApplicationService {
    if (!this.weightSnapshotService) {
      this.weightSnapshotService = new WeightSnapshotApplicationService(
        this.getGoalRepository(),
        this.getWeightSnapshotRepository()
      );
    }
    return this.weightSnapshotService;
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
    this.weightSnapshotRepository = undefined;

    this.goalService = undefined;
    this.goalFolderService = undefined;
    this.goalStatisticsService = undefined;
    this.focusSessionService = undefined;
    this.focusModeService = undefined;
    this.goalKeyResultService = undefined;
    this.goalRecordService = undefined;
    this.goalReviewService = undefined;
    this.weightSnapshotService = undefined;
  }
}
