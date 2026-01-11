/**
 * Invalidate Dashboard Cache
 *
 * 失效 Dashboard 缓存
 */

import { DashboardContainer, type IStatisticsCacheService } from '@dailyuse/infrastructure-server';

/**
 * Invalidate Dashboard Cache
 */
export class InvalidateDashboardCache {
  private static instance: InvalidateDashboardCache;

  private constructor(private readonly cacheService: IStatisticsCacheService) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(cacheService?: IStatisticsCacheService): InvalidateDashboardCache {
    const container = DashboardContainer.getInstance();
    const cache = cacheService || container.getStatisticsCacheService();
    InvalidateDashboardCache.instance = new InvalidateDashboardCache(cache);
    return InvalidateDashboardCache.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): InvalidateDashboardCache {
    if (!InvalidateDashboardCache.instance) {
      InvalidateDashboardCache.instance = InvalidateDashboardCache.createInstance();
    }
    return InvalidateDashboardCache.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    InvalidateDashboardCache.instance = undefined as unknown as InvalidateDashboardCache;
  }

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<void> {
    console.log(`[InvalidateDashboardCache] 失效账户 ${accountUuid} 的缓存`);
    await this.cacheService.invalidate(accountUuid);
  }
}
