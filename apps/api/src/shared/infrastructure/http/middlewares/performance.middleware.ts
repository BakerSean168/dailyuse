/**
 * @file performance.middleware.ts
 * @description 性能监控中间件，用于记录请求处理时间和 endpoint 指标统计。
 * @date 2025-01-22
 */

import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('PerformanceMiddleware');

/**
 * 性能指标数据结构。
 */
interface PerformanceMetrics {
  method: string;
  url: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

/**
 * 内存指标存储 (简单实现)。
 *
 * @remarks
 * 用于存储每个 Endpoint 的响应时间样本，并计算统计信息。
 * 限制每个 Endpoint 最多存储 1000 个样本。
 */
class MetricsStore {
  private metrics: Map<string, number[]> = new Map();
  private readonly MAX_SAMPLES = 1000; // Keep last 1000 requests per endpoint

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

    // Keep only last MAX_SAMPLES
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
  getStats(endpoint: string): {
    count: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  } | null {
    const values = this.metrics.get(endpoint);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / count),
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
      max: Math.max(...values),
    };
  }

  /**
   * 获取所有 Endpoint 的统计信息。
   * @returns {Record<string, object>} 所有统计信息
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const [endpoint, _] of this.metrics.entries()) {
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

export const metricsStore = new MetricsStore();

/**
 * 性能监控中间件。
 *
 * @remarks
 * - 记录请求处理时长
 * - 记录 Endpoint 级别的性能指标
 * - 添加 X-Response-Time 响应头
 * - 对慢请求 (>300ms) 打印警告日志
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - 下一个中间件函数
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 跳过 SSE 路由 - SSE 是长连接，不适合用常规性能监控
  if (req.path.includes('/sse/')) {
    return next();
  }
  
  const start = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  // Override res.json to capture when response is sent
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - start;

    // Log performance
    const logLevel = duration > 300 ? 'warn' : 'debug';
    logger[logLevel](`[PERF] ${endpoint} - ${duration}ms - ${res.statusCode}`);

    // Store metrics
    metricsStore.recordRequest(endpoint, duration);

    // Add performance header
    res.setHeader('X-Response-Time', `${duration}ms`);

    return originalJson(body);
  };

  // Handle response end for non-JSON responses
  res.on('finish', () => {
    if (res.getHeader('X-Response-Time')) {
      return; // Already logged via json override
    }

    const duration = Date.now() - start;
    const logLevel = duration > 300 ? 'warn' : 'debug';
    logger[logLevel](`[PERF] ${endpoint} - ${duration}ms - ${res.statusCode}`);

    metricsStore.recordRequest(endpoint, duration);
    
    // 只在响应头未发送时设置
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
  });

  next();
}

/**
 * 获取指定 Endpoint 的性能指标。
 * @param endpoint - Endpoint 标识 (e.g. "GET /api/users")
 */
export function getEndpointMetrics(endpoint: string) {
  return metricsStore.getStats(endpoint);
}

/**
 * 获取所有 Endpoint 的性能指标。
 */
export function getAllMetrics() {
  return metricsStore.getAllStats();
}

/**
 * 清除所有性能指标。
 */
export function clearMetrics() {
  metricsStore.clear();
}
