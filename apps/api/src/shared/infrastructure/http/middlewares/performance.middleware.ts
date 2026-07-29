/**
 * @file performance.middleware.ts
 * @description 性能监控中间件，用于记录请求处理时间和 endpoint 指标统计。
 * @date 2025-01-22
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createLogger } from '@memoflow/utils/logger';

const logger = createLogger('PerformanceMiddleware');

/**
 * Endpoint 聚合统计。
 */
export type EndpointPerformanceStats = {
  count: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
};

/**
 * 内存指标存储 (简单实现)。
 *
 * @remarks
 * 用于存储每个 Endpoint 的响应时间样本，并计算统计信息。
 * 限制每个 Endpoint 最多存储 1000 个样本。
 */
export class MetricsStore {
  private metrics: Map<string, number[]> = new Map();
  private readonly MAX_SAMPLES = 1000;

  /**
   * 记录请求耗时。
   * @param endpoint - 请求的 Endpoint (Method + Path)
   * @param duration - 耗时 (ms)
   */
  recordRequest(endpoint: string, duration: number): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }

    const values = this.metrics.get(endpoint)!;
    values.push(duration);

    if (values.length > this.MAX_SAMPLES) {
      values.shift();
    }
  }

  /**
   * 获取指定 Endpoint 的统计信息。
   *
   * @param endpoint - 请求的 Endpoint
   * @returns {object | null} 统计信息 (count, avg, p50, p95, p99, max)
   */
  getStats(endpoint: string): EndpointPerformanceStats | null {
    const values = this.metrics.get(endpoint);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / count),
      p50: sorted[Math.floor(count * 0.5)] ?? sorted[count - 1]!,
      p95: sorted[Math.floor(count * 0.95)] ?? sorted[count - 1]!,
      p99: sorted[Math.floor(count * 0.99)] ?? sorted[count - 1]!,
      max: Math.max(...values),
    };
  }

  /**
   * 获取所有 Endpoint 的统计信息。
   * @returns {Record<string, object>} 所有统计信息
   */
  getAllStats(): Record<string, EndpointPerformanceStats | null> {
    const result: Record<string, EndpointPerformanceStats | null> = {};

    for (const endpoint of this.metrics.keys()) {
      result[endpoint] = this.getStats(endpoint);
    }

    return result;
  }

  /**
   * 清除所有指标。
   */
  clear(): void {
    this.metrics.clear();
  }
}

export function createPerformanceMiddleware(metricsStore: MetricsStore): RequestHandler {
  return function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (req.path.includes('/sse/')) {
      next();
      return;
    }

    const start = Date.now();
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    const originalJson = res.json.bind(res) as (body: unknown) => Response;
    res.json = ((body: unknown) => {
      const duration = Date.now() - start;
      const logLevel = duration > 300 ? 'warn' : 'debug';
      logger[logLevel](`[PERF] ${endpoint} - ${duration}ms - ${res.statusCode}`);

      metricsStore.recordRequest(endpoint, duration);
      res.setHeader('X-Response-Time', `${duration}ms`);

      return originalJson(body);
    }) as Response['json'];

    res.on('finish', () => {
      if (res.getHeader('X-Response-Time')) {
        return;
      }

      const duration = Date.now() - start;
      const logLevel = duration > 300 ? 'warn' : 'debug';
      logger[logLevel](`[PERF] ${endpoint} - ${duration}ms - ${res.statusCode}`);

      metricsStore.recordRequest(endpoint, duration);

      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration}ms`);
      }
    });

    next();
  };
}
