/**
 * RateLimit Value Object
 * 速率限制值对象
 */

// ============ 接口定义 ============

/**
 * RateLimit 接口
 */
export interface RateLimit {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

// ============ DTO 定义 ============

/**
 * RateLimit DTO (传输层)
 */
export interface RateLimitDTO {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

