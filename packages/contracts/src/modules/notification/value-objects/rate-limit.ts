/**
 * RateLimit Value Object
 * 速率限制值对象
 *
 * Residual 849: RateLimitDTO dual retired — sole RateLimit interface + type alias.
 */

// Residual 849: sole RateLimit body.
export interface RateLimit {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
}

// Residual 849: RateLimitDTO dual retired — DTO is the RateLimit shape.
export type RateLimitDTO = RateLimit;
