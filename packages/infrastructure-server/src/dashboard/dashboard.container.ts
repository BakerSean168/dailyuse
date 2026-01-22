/**
 * Dashboard Container (Server)
 *
 * 依赖注入容器，管�?Dashboard 模块�?repository 和缓存服务实�?
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';

/**
 * Statistics Cache Service Interface
 */
export interface IStatisticsCacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

/**
 * Dashboard 模块依赖注入容器
 */
export class DashboardContainer {
  private static instance: DashboardContainer;
  private dashboardConfigRepository: IDashboardConfigRepository | null = null;
  private statisticsCacheService: IStatisticsCacheService | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    DashboardContainer.instance = new DashboardContainer();
  }

  /**
   * 注册 DashboardConfigRepository
   */
  registerDashboardConfigRepository(repository: IDashboardConfigRepository): this {
    this.dashboardConfigRepository = repository;
    return this;
  }

  /**
   * 注册 StatisticsCacheService
   */
  registerStatisticsCacheService(service: IStatisticsCacheService): this {
    this.statisticsCacheService = service;
    return this;
  }

  /**
   * 获取 DashboardConfigRepository
   */
  getDashboardConfigRepository(): IDashboardConfigRepository {
    if (!this.dashboardConfigRepository) {
      throw new Error('DashboardConfigRepository not registered.');
    }
    return this.dashboardConfigRepository;
  }

  /**
   * 获取 StatisticsCacheService
   */
  getStatisticsCacheService(): IStatisticsCacheService {
    if (!this.statisticsCacheService) {
      throw new Error('StatisticsCacheService not registered.');
    }
    return this.statisticsCacheService;
  }

  /**
   * 检查缓存服务是否已注册
   */
  hasCacheService(): boolean {
    return this.statisticsCacheService !== null;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.dashboardConfigRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.dashboardConfigRepository = null;
    this.statisticsCacheService = null;
  }
}
