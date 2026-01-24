/**
 * Dashboard Container (Server)
 *
 * 渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞?Dashboard 妯″潡鐨?repository 鍜岀紦瀛樻湇鍔″疄渚?
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
 * Dashboard 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒
 */
export class DashboardContainer {
  private static instance: DashboardContainer;
  private dashboardConfigRepository: IDashboardConfigRepository | null = null;
  private statisticsCacheService: IStatisticsCacheService | null = null;

  private constructor() {}

  /**
   * 鑾峰彇瀹瑰櫒鍗曚緥
   */
  static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級
   */
  static resetInstance(): void {
    DashboardContainer.instance = new DashboardContainer();
  }

  /**
   * 娉ㄥ唽 DashboardConfigRepository
   */
  registerDashboardConfigRepository(repository: IDashboardConfigRepository): this {
    this.dashboardConfigRepository = repository;
    return this;
  }

  /**
   * 娉ㄥ唽 StatisticsCacheService
   */
  registerStatisticsCacheService(service: IStatisticsCacheService): this {
    this.statisticsCacheService = service;
    return this;
  }

  /**
   * 鑾峰彇 DashboardConfigRepository
   */
  getDashboardConfigRepository(): IDashboardConfigRepository {
    if (!this.dashboardConfigRepository) {
      throw new Error('DashboardConfigRepository not registered.');
    }
    return this.dashboardConfigRepository;
  }

  /**
   * 鑾峰彇 StatisticsCacheService
   */
  getStatisticsCacheService(): IStatisticsCacheService {
    if (!this.statisticsCacheService) {
      throw new Error('StatisticsCacheService not registered.');
    }
    return this.statisticsCacheService;
  }

  /**
   * 妫€鏌ョ紦瀛樻湇鍔℃槸鍚﹀凡娉ㄥ唽
   */
  hasCacheService(): boolean {
    return this.statisticsCacheService !== null;
  }

  /**
   * 妫€鏌ユ槸鍚﹀凡閰嶇疆
   */
  isConfigured(): boolean {
    return this.dashboardConfigRepository !== null;
  }

  /**
   * 娓呯┖鎵€鏈夋敞鍐岀殑渚濊禆
   */
  clear(): void {
    this.dashboardConfigRepository = null;
    this.statisticsCacheService = null;
  }
}
