/**
 * Invalidate Dashboard Cache
 *
 * 失效 Dashboard 缓存
 */

/**
 * Cache service interface
 */
interface ICacheService {
  invalidate(accountUuid: string): Promise<void>;
}

/**
 * Invalidate Dashboard Cache
 */
export class InvalidateDashboardCache {
  constructor(private readonly cacheService: ICacheService) {}

  /**
   * 执行用例
   */
  async execute(accountUuid: string): Promise<void> {
    console.log(`[InvalidateDashboardCache] 失效账户 ${accountUuid} 的缓存`);
    await this.cacheService.invalidate(accountUuid);
  }
}
