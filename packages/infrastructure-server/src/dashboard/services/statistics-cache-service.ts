/**
 * @file StatisticsCacheService.ts
 * @description 缁熻鏁版嵁缂撳瓨鏈嶅姟锛屽熀锟?Redis 瀹炵幇锟?
 * @date 2025-01-22
 */

import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import type { DashboardConfigServerDTO, WidgetConfigDTO, DashboardStatisticsClientDTO } from '@dailyuse/contracts/dashboard';
import { getRedisConfig, env } from '../../shared/config/env';

/**
 * 缁熻鏁版嵁缂撳瓨鏈嶅姟锟?
 *
 * @remarks
 * 璐熻矗绠＄悊浠〃鏉跨粺Count鎹殑缂撳瓨锟?
 * - 浣跨敤 Redis 浣滀负鍚庣瀛樺偍锟?
 * - 榛樿 TTL 锟?5 鍒嗛挓锟?
 * - 鎻愪緵缂撳瓨璇诲彇銆佸啓鍏ャ€佸け鏁堝拰鎵归噺绠＄悊鍔熻兘锟?
 * - 鍏峰杩炴帴澶辫触閲嶈瘯鍜岄敊璇鐞嗘満鍒讹拷?
 *
 * 鏋舵瀯灞傛锛欼nfrastructure Layer
 */
export class StatisticsCacheService {
  private readonly redis: Redis;
  private readonly ttlSeconds = 300; // 5 鍒嗛挓
  private readonly keyPrefix = 'dashboard:statistics';

  constructor(redisUrl?: string) {
    // 鏀寔涓ょ閰嶇疆鏂瑰紡锟?
    // 1. REDIS_URL (瀹屾暣 URL): redis://:password@host:port/db
    // 2. 鍒嗙閰嶇疆: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB
    const redisConfig = getRedisConfig();

    if (redisUrl || env.REDIS_URL) {
      // 浣跨敤 URL 鏂瑰紡 (ioredis 浼氳嚜鍔ㄨВ锟?URL)
      const url = redisUrl || env.REDIS_URL!;
      this.redis = new Redis(url, {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.warn(`[StatisticsCache] Redis 杩炴帴澶辫触锟?{delay}ms 鍚庨噸锟?(灏濊瘯 ${times} 锟?`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });
    } else {
      // 浣跨敤鍒嗙閰嶇疆
      this.redis = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.warn(`[StatisticsCache] Redis 杩炴帴澶辫触锟?{delay}ms 鍚庨噸锟?(灏濊瘯 ${times} 锟?`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });
    }

    this.redis.on('connect', () => {
      console.log('[StatisticsCache] 锟?Redis 杩炴帴鎴愬姛');
    });

    this.redis.on('error', (error) => {
      console.error('[StatisticsCache] 锟?Redis 杩炴帴閿欒:', error.message);
    });

    this.redis.on('reconnecting', () => {
      console.log('[StatisticsCache] 馃攧 Redis 閲嶆柊杩炴帴锟?..');
    });
  }

  /**
   * 鐢熸垚缂撳瓨閿拷?
   *
   * @param userId - 鐢ㄦ埛 ID
   * @returns Redis 閿悕
   */
  private getCacheKey(userId: string): string {
    return `${this.keyPrefix}:${userId}`;
  }

  /**
   * Get缂撳瓨鐨勭粺Count鎹拷?
   *
   * @param userId - 鐢ㄦ埛 ID
   * @returns {Promise<DashboardStatisticsClientDTO | null>} 缁熻鏁版嵁锟?null
   */
  async get(userId: string): Promise<DashboardStatisticsClientDTO | null> {
    const key = this.getCacheKey(userId);

    try {
      const cached = await this.redis.get(key);

      if (!cached) {
        console.log(`[StatisticsCache] 缂撳瓨鏈懡锟? ${key}`);
        return null;
      }

      console.log(`[StatisticsCache] 锟?缂撳瓨鍛戒腑: ${key}`);
      return JSON.parse(cached);
    } catch (error) {
      console.error(
        `[StatisticsCache] 缂撳瓨璇诲彇澶辫触: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
      return null; // 闄嶇骇澶勭悊
    }
  }

  /**
   * 璁剧疆缂撳瓨鏁版嵁锟?
   *
   * @param userId - 鐢ㄦ埛 ID
   * @param data - 缁熻鏁版嵁
   * @returns {Promise<void>}
   */
  async set(userId: string, data: DashboardStatisticsClientDTO): Promise<void> {
    const key = this.getCacheKey(userId);

    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(key, this.ttlSeconds, serialized);

      console.log(`[StatisticsCache] 缂撳瓨宸茶锟? ${key} (TTL: ${this.ttlSeconds}s)`);
    } catch (error) {
      console.error(
        `[StatisticsCache] 缂撳瓨鍐欏叆澶辫触: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
      // 涓嶆姏鍑洪敊璇紝鍏佽绯荤粺缁х画杩愯
    }
  }

  /**
   * Delete缂撳瓨鏁版嵁锛堜富鍔ㄥけ鏁堬級锟?
   *
   * @param userId - 鐢ㄦ埛 ID
   * @returns {Promise<void>}
   */
  async invalidate(userId: string): Promise<void> {
    const key = this.getCacheKey(userId);

    try {
      const deleted = await this.redis.del(key);

      if (deleted > 0) {
        console.log(`[StatisticsCache] 馃棏锟? 缂撳瓨宸插け锟? ${key}`);
      } else {
        console.log(`[StatisticsCache] 缂撳瓨涓嶅瓨鍦紝鏃犻渶澶辨晥: ${key}`);
      }
    } catch (error) {
      console.error(
        `[StatisticsCache] 缂撳瓨澶辨晥澶辫触: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * 鎵归噺Delete缂撳瓨锛堢敤浜庣鐞嗘搷浣滐級锟?
   *
   * @param pattern - 閿悕鍖归厤妯″紡
   * @returns {Promise<number>} Delete鐨勯敭鏁伴噺
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        console.log(`[StatisticsCache] 娌℃湁鍖归厤鐨勭紦瀛橀敭: ${pattern}`);
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      console.log(`[StatisticsCache] 馃棏锟? 鎵归噺Delete ${deleted} 涓紦瀛橀敭: ${pattern}`);

      return deleted;
    } catch (error) {
      console.error(
        `[StatisticsCache] 鎵归噺缂撳瓨澶辨晥澶辫触: ${pattern}`,
        error instanceof Error ? error.message : String(error),
      );
      return 0;
    }
  }

  /**
   * Get缂撳瓨鐨勫墿锟?TTL锟?
   *
   * @param userId - 鐢ㄦ埛 ID
   * @returns {Promise<number>} 鍓╀綑绉掓暟锟?2 琛ㄧず涓嶅瓨鍦紝-1 琛ㄧず鏃犺繃鏈熸椂锟?
   */
  async getTtl(userId: string): Promise<number> {
    const key = this.getCacheKey(userId);

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(
        `[StatisticsCache] Get TTL 澶辫触: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
      return -2;
    }
  }

  /**
   * 妫€锟?Redis 杩炴帴鐘舵€侊拷?
   *
   * @returns {Promise<boolean>} 鏄惁杩炴帴姝ｅ父
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error(
        '[StatisticsCache] Redis ping 澶辫触:',
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  /**
   * 鍏抽棴 Redis 杩炴帴锟?
   *
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    console.log('[StatisticsCache] 姝ｅ湪鍏抽棴 Redis 杩炴帴...');
    await this.redis.quit();
  }

  /**
   * Get缂撳瓨缁熻淇℃伅锟?
   *
   * @returns {Promise<object>} 缁熻淇℃伅锛堥敭鏁伴噺銆佸唴瀛樹娇鐢ㄣ€佽繛鎺ョ姸鎬侊級
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    connected: boolean;
  }> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}:*`);
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        totalKeys: keys.length,
        memoryUsage,
        connected: this.redis.status === 'ready',
      };
    } catch (error) {
      console.error(
        '[StatisticsCache] Get缁熻淇℃伅澶辫触:',
        error instanceof Error ? error.message : String(error),
      );
      return {
        totalKeys: 0,
        memoryUsage: 'unknown',
        connected: false,
      };
    }
  }
}
