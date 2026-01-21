/**
 * @file DashboardContainer.ts
 * @description Dashboard 模块依赖注入容器，管理服务的实例化和生命周期。
 * @date 2025-01-22
 */

import type {
  ITaskStatisticsRepository,
} from '@dailyuse/domain-server/task';
import type {
  IGoalStatisticsRepository,
} from '@dailyuse/domain-server/goal';
import type {
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';
import type {
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { PrismaTaskStatisticsRepository } from '../../task';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import { ReminderContainer } from '@dailyuse/infrastructure-server';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
import type { StatisticsCacheService } from '../services/StatisticsCacheService';
import { prisma } from '@/shared/infrastructure/config/prisma';
import { DashboardConfigPrismaRepository } from '../repositories/DashboardConfigPrismaRepository';
import { StatisticsCacheService as CacheServiceImpl } from '../services/StatisticsCacheService';

/**
 * Dashboard 模块依赖注入容器。
 *
 * @remarks
 * 负责管理 Dashboard 相关服务的实例创建和生命周期。
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 服务用于单元测试
 */
export class DashboardContainer {
  private static instance: DashboardContainer;
  private cacheService?: StatisticsCacheService;
  private configRepository?: IDashboardConfigRepository;

  private constructor() {}

  /**
   * 获取容器单例。
   * @returns {DashboardContainer}
   */
  static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  /**
   * 获取 TaskStatistics 仓储实例。
   * @returns {ITaskStatisticsRepository}
   */
  getTaskStatisticsRepository(): ITaskStatisticsRepository {
    return new PrismaTaskStatisticsRepository(prisma);
  }

  /**
   * 获取 GoalStatistics 仓储实例。
   * @returns {IGoalStatisticsRepository}
   */
  getGoalStatisticsRepository(): IGoalStatisticsRepository {
    return GoalContainer.getInstance().getGoalStatisticsRepository();
  }

  /**
   * 获取 ReminderStatistics 仓储实例。
   * @returns {IReminderStatisticsRepository}
   */
  getReminderStatisticsRepository(): IReminderStatisticsRepository {
    return ReminderContainer.getInstance().getReminderStatisticsRepository();
  }

  /**
   * 获取 ScheduleStatistics 仓储实例。
   * @returns {IScheduleStatisticsRepository}
   */
  getScheduleStatisticsRepository(): IScheduleStatisticsRepository {
    return ScheduleContainer.getInstance().getScheduleStatisticsRepository();
  }

  /**
   * 获取缓存服务实例（懒加载）。
   * @returns {StatisticsCacheService}
   */
  getCacheService(): StatisticsCacheService {
    if (!this.cacheService) {
      this.cacheService = new CacheServiceImpl();
    }
    return this.cacheService;
  }

  /**
   * 获取 Dashboard 配置仓储实例（懒加载）。
   * @returns {IDashboardConfigRepository}
   */
  getDashboardConfigRepository(): IDashboardConfigRepository {
    if (!this.configRepository) {
      this.configRepository = new DashboardConfigPrismaRepository(prisma);
    }
    return this.configRepository;
  }

  /**
   * 设置缓存服务实例（用于测试）。
   * @param service - 缓存服务 Mock 实例
   */
  setCacheService(service: StatisticsCacheService): void {
    this.cacheService = service;
  }

  /**
   * 重置容器（用于测试）。
   */
  reset(): void {
    this.cacheService = undefined;
  }
}
