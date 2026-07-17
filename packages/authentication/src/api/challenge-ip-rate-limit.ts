/**
 * Lightweight in-memory IP rate limiter for auth challenge endpoints.
 * 认证 challenge 端点的轻量内存 IP 限流（开发/单实例可用）。
 *
 * Complements subject-level challenge store limits (email cooldown / daily budget).
 * Production multi-instance deployments should replace with Redis.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

export interface ChallengeIpRateLimitOptions {
  /** Max requests per window for a single IP. */
  readonly max: number;
  /** Window length in ms. */
  readonly windowMs: number;
  /** Optional key prefix to isolate endpoints. */
  readonly keyPrefix?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0]!.trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Create an Express middleware that rate-limits by client IP.
 * Returns 429 Result envelope when exceeded.
 */
export function createChallengeIpRateLimitMiddleware(
  options: ChallengeIpRateLimitOptions,
): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const prefix = options.keyPrefix ?? 'auth-challenge';

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const ip = clientIp(req);
    const key = `${prefix}:${ip}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > options.max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          context: {
            domainCode: 'CHALLENGE_RATE_LIMITED',
            retryAfterMs: bucket.resetAt - now,
          },
        },
      });
      return;
    }

    // Opportunistic cleanup of expired buckets (bounded).
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
    }

    next();
  };
}

/** Default: 20 requests / 15 minutes / IP for forgot + send-code style endpoints. */
export function createDefaultAuthChallengeIpRateLimit(
  keyPrefix: string,
): RequestHandler {
  return createChallengeIpRateLimitMiddleware({
    max: 20,
    windowMs: 15 * 60 * 1000,
    keyPrefix,
  });
}
