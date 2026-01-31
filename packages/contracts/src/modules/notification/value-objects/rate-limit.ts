/**
 * RateLimit Value Object
 * 速率限制值对象
 */

// ============ 接口定义 ============

/**
 * RateLimit Server Interface
 */
export interface IRateLimit {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  // 值对象方法
  with(
    updates: Partial<
      Omit<IRateLimit, 'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>
    >,
  ): IRateLimit;

  // DTO 转换方法
}

/**
 * RateLimit Client Interface
 */
export interface IRateLimitClient {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;

  // UI 计算属性
  limitText: string;

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * RateLimit DTO (Server)
 */
export interface RateLimitDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

/**
 * RateLimit Client DTO
 */
export interface RateLimitClientDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  limitText: string;
}

/**
 * RateLimit Persistence DTO
 */
export interface RateLimitPersistenceDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

// ============ 实现类型 ============

export type RateLimit = IRateLimit;
export type RateLimitClient = IRateLimitClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use RateLimitDTO instead
 */
export type RateLimitServerDTO = RateLimitDTO;

/**
 * @deprecated Use IRateLimit instead
 */
export type IRateLimitServer = IRateLimit;

/**
 * @deprecated Use RateLimit instead
 */
export type RateLimitServer = RateLimit;
