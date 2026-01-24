/**
 * @file DashboardContainer.ts
 * @description Dashboard 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒锛岀鐞嗘湇鍔＄殑瀹炰緥鍖栧拰鐢熷懡鍛ㄦ湡銆?
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
import { prisma } from '../../shared/config/prisma';
import { DashboardConfigPrismaRepository } from '../repositories/DashboardConfigPrismaRepository';
import { StatisticsCacheService as CacheServiceImpl } from '../services/StatisticsCacheService';

/**
 * Dashboard 妯″潡渚濊禆娉ㄥ叆瀹瑰櫒銆?
 *
 * @remarks
 * 璐熻矗绠＄悊 Dashboard 鐩稿叧鏈嶅姟鐨勫疄渚嬪垱寤哄拰鐢熷懡鍛ㄦ湡銆?
 *
 * 閲囩敤鎳掑姞杞芥ā寮忥細
 * - 鍙湪棣栨璋冪敤鏃跺垱寤哄疄渚?
 * - 鍚庣画璋冪敤杩斿洖宸叉湁瀹炰緥锛堝崟渚嬶級
 *
 * 鏀寔娴嬭瘯鏇挎崲锛?
 * - 鍏佽娉ㄥ叆 Mock 鏈嶅姟鐢ㄤ簬鍗曞厓娴嬭瘯
 */
export class DashboardContainer {
  private static instance: DashboardContainer;
  private cacheService?: StatisticsCacheService;
  private configRepository?: IDashboardConfigRepository;

  private constructor() {}

  /**
   * 鑾峰彇瀹瑰櫒鍗曚緥銆?
   * @returns {DashboardContainer}
   */
  static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  /**
   * 鑾峰彇 TaskStatistics 浠撳偍瀹炰緥銆?
   * @returns {ITaskStatisticsRepository}
   */
  getTaskStatisticsRepository(): ITaskStatisticsRepository {
    return new PrismaTaskStatisticsRepository(prisma);
  }

  /**
   * 鑾峰彇 GoalStatistics 浠撳偍瀹炰緥銆?
   * @returns {IGoalStatisticsRepository}
   */
  getGoalStatisticsRepository(): IGoalStatisticsRepository {
    return GoalContainer.getInstance().getGoalStatisticsRepository();
  }

  /**
   * 鑾峰彇 ReminderStatistics 浠撳偍瀹炰緥銆?
   * @returns {IReminderStatisticsRepository}
   */
  getReminderStatisticsRepository(): IReminderStatisticsRepository {
    return ReminderContainer.getInstance().getReminderStatisticsRepository();
  }

  /**
   * 鑾峰彇 ScheduleStatistics 浠撳偍瀹炰緥銆?
   * @returns {IScheduleStatisticsRepository}
   */
  getScheduleStatisticsRepository(): IScheduleStatisticsRepository {
    return ScheduleContainer.getInstance().getScheduleStatisticsRepository();
  }

  /**
   * 鑾峰彇缂撳瓨鏈嶅姟瀹炰緥锛堟噿鍔犺浇锛夈€?
   * @returns {StatisticsCacheService}
   */
  getCacheService(): StatisticsCacheService {
    if (!this.cacheService) {
      this.cacheService = new CacheServiceImpl();
    }
    return this.cacheService;
  }

  /**
   * 鑾峰彇 Dashboard 閰嶇疆浠撳偍瀹炰緥锛堟噿鍔犺浇锛夈€?
   * @returns {IDashboardConfigRepository}
   */
  getDashboardConfigRepository(): IDashboardConfigRepository {
    if (!this.configRepository) {
      this.configRepository = new DashboardConfigPrismaRepository(prisma);
    }
    return this.configRepository;
  }

  /**
   * 璁剧疆缂撳瓨鏈嶅姟瀹炰緥锛堢敤浜庢祴璇曪級銆?
   * @param service - 缂撳瓨鏈嶅姟 Mock 瀹炰緥
   */
  setCacheService(service: StatisticsCacheService): void {
    this.cacheService = service;
  }

  /**
   * 閲嶇疆瀹瑰櫒锛堢敤浜庢祴璇曪級銆?
   */
  reset(): void {
    this.cacheService = undefined;
  }
}

