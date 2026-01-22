/**
 * @file StatisticsCacheService.ts
 * @description 统计数据缓存服务，基�?Redis 实现�?
 * @date 2025-01-22
 */

import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import type { DashboardConfigServerDTO, WidgetConfigDTO, DashboardStatisticsClientDTO } from '@dailyuse/contracts/dashboard';
import { getRedisConfig, env } from '../../shared/config/env';

/**
 * 统计数据缓存服务�?
 *
 * @remarks
 * 负责管理仪表板统计数据的缓存�?
 * - 使用 Redis 作为后端存储�?
 * - 默认 TTL �?5 分钟�?
 * - 提供缓存读取、写入、失效和批量管理功能�?
 * - 具备连接失败重试和错误处理机制�?
 *
 * 架构层次：Infrastructure Layer
 */
export class StatisticsCacheService {
  private readonly redis: Redis;
  private readonly ttlSeconds = 300; // 5 分钟
  private readonly keyPrefix = 'dashboard:statistics';

  constructor(redisUrl?: string) {
    // 支持两种配置方式�?
    // 1. REDIS_URL (完整 URL): redis://:password@host:port/db
    // 2. 分离配置: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB
    const redisConfig = getRedisConfig();

    if (redisUrl || env.REDIS_URL) {
      // 使用 URL 方式 (ioredis 会自动解�?URL)
      const url = redisUrl || env.REDIS_URL!;
      this.redis = new Redis(url, {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.warn(`[StatisticsCache] Redis 连接失败�?{delay}ms 后重�?(尝试 ${times} �?`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });
    } else {
      // 使用分离配置
      this.redis = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.warn(`[StatisticsCache] Redis 连接失败�?{delay}ms 后重�?(尝试 ${times} �?`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });
    }

    this.redis.on('connect', () => {
      console.log('[StatisticsCache] �?Redis 连接成功');
    });

    this.redis.on('error', (error) => {
      console.error('[StatisticsCache] �?Redis 连接错误:', error.message);
    });

    this.redis.on('reconnecting', () => {
      console.log('[StatisticsCache] 🔄 Redis 重新连接�?..');
    });
  }

  /**
   * 生成缓存键�?
   *
   * @param userId - 用户 ID
   * @returns Redis 键名
   */
  private getCacheKey(userId: string): string {
    return `${this.keyPrefix}:${userId}`;
  }

  /**
   * 获取缓存的统计数据�?
   *
   * @param userId - 用户 ID
   * @returns {Promise<DashboardStatisticsClientDTO | null>} 统计数据�?null
   */
  async get(userId: string): Promise<DashboardStatisticsClientDTO | null> {
    const key = this.getCacheKey(userId);

    try {
      const cached = await this.redis.get(key);

      if (!cached) {
        console.log(`[StatisticsCache] 缓存未命�? ${key}`);
        return null;
      }

      console.log(`[StatisticsCache] �?缓存命中: ${key}`);
      return JSON.parse(cached);
    } catch (error) {
      console.error(
        `[StatisticsCache] 缓存读取失败: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
      return null; // 降级处理
    }
  }

  /**
   * 设置缓存数据�?
   *
   * @param userId - 用户 ID
   * @param data - 统计数据
   * @returns {Promise<void>}
   */
  async set(userId: string, data: DashboardStatisticsClientDTO): Promise<void> {
    const key = this.getCacheKey(userId);

    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(key, this.ttlSeconds, serialized);

      console.log(`[StatisticsCache] 缓存已设�? ${key} (TTL: ${this.ttlSeconds}s)`);
    } catch (error) {
      console.error(
        `[StatisticsCache] 缓存写入失败: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
      // 不抛出错误，允许系统继续运行
    }
  }

  /**
   * 删除缓存数据（主动失效）�?
   *
   * @param userId - 用户 ID
   * @returns {Promise<void>}
   */
  async invalidate(userId: string): Promise<void> {
    const key = this.getCacheKey(userId);

    try {
      const deleted = await this.redis.del(key);

      if (deleted > 0) {
        console.log(`[StatisticsCache] 🗑�? 缓存已失�? ${key}`);
      } else {
        console.log(`[StatisticsCache] 缓存不存在，无需失效: ${key}`);
      }
    } catch (error) {
      console.error(
        `[StatisticsCache] 缓存失效失败: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * 批量删除缓存（用于管理操作）�?
   *
   * @param pattern - 键名匹配模式
   * @returns {Promise<number>} 删除的键数量
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        console.log(`[StatisticsCache] 没有匹配的缓存键: ${pattern}`);
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      console.log(`[StatisticsCache] 🗑�? 批量删除 ${deleted} 个缓存键: ${pattern}`);

      return deleted;
    } catch (error) {
      console.error(
        `[StatisticsCache] 批量缓存失效失败: ${pattern}`,
        error instanceof Error ? error.message : String(error),
      );
      return 0;
    }
  }

  /**
   * 获取缓存的剩�?TTL�?
   *
   * @param userId - 用户 ID
   * @returns {Promise<number>} 剩余秒数�?2 表示不存在，-1 表示无过期时�?
   */
  async getTtl(userId: string): Promise<number> {
    const key = this.getCacheKey(userId);

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(
        `[StatisticsCache] 获取 TTL 失败: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
      return -2;
    }
  }

  /**
   * 检�?Redis 连接状态�?
   *
   * @returns {Promise<boolean>} 是否连接正常
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error(
        '[StatisticsCache] Redis ping 失败:',
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  /**
   * 关闭 Redis 连接�?
   *
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    console.log('[StatisticsCache] 正在关闭 Redis 连接...');
    await this.redis.quit();
  }

  /**
   * 获取缓存统计信息�?
   *
   * @returns {Promise<object>} 统计信息（键数量、内存使用、连接状态）
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
        '[StatisticsCache] 获取统计信息失败:',
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
