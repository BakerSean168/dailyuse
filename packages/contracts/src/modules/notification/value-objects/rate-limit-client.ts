/**
 * RateLimit Value Object (Client)
 * 速率限制 - 客户�?
 */

import type { RateLimitServerDTO } from './rate-limit-server';

// ============ 接口定义 ============

/**
 * 速率限制 - Client 接口
 */
export interface IRateLimitClient {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  limitText: string;

  // 方法

  // DTO 转换
}

// ============ DTO 定义 ============

/**
 * RateLimit Client DTO
 */
export interface RateLimitClientDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  limitText: string;
}

// ============ 实现 ============

export type RateLimitClient = IRateLimitClient;
