/**
 * @file metrics.controller.ts
 * @description 指标控制器 - 提供 Prometheus 兼容格式的性能指标
 * @date 2025-12-22
 */

import type { Request, Response } from 'express';
import type { MetricsStore } from '../middlewares/performance.middleware';

/**
 * 指标控制器
 *
 * 提供以下端点：
 * - `/metrics` - Prometheus 格式的指标输出
 */
export function createMetricsController(metricsStore: MetricsStore) {
  return {
    /**
     * 获取 Prometheus 格式的指标
     *
     * @route GET /metrics
     */
    getPrometheus: (_req: Request, res: Response): void => {
      const metrics = metricsStore.getAllStats();
      const lines: string[] = [];

      lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds');
      lines.push('# TYPE http_request_duration_ms histogram');
      lines.push('');
      lines.push('# HELP http_requests_total Total number of HTTP requests');
      lines.push('# TYPE http_requests_total counter');
      lines.push('');

      for (const [endpoint, stats] of Object.entries(metrics)) {
        if (!stats) continue;

        const [method, ...pathParts] = endpoint.split(' ');
        const path = pathParts.join(' ') || '/';
        const labels = `method="${method}",path="${path}"`;

        lines.push(`http_requests_total{${labels}} ${stats.count}`);
        lines.push(`http_request_duration_ms_sum{${labels}} ${Math.round(stats.avg * stats.count)}`);
        lines.push(`http_request_duration_ms_count{${labels}} ${stats.count}`);
        lines.push(`http_request_duration_ms_avg{${labels}} ${stats.avg}`);
        lines.push(`http_request_duration_ms_p50{${labels}} ${stats.p50}`);
        lines.push(`http_request_duration_ms_max{${labels}} ${stats.max}`);
        lines.push(`http_request_duration_ms_p95{${labels}} ${stats.p95}`);
        lines.push(`http_request_duration_ms_p99{${labels}} ${stats.p99}`);
        lines.push('');
      }

      const memoryUsage = process.memoryUsage();
      lines.push('# HELP process_memory_heap_bytes Process heap memory usage');
      lines.push('# TYPE process_memory_heap_bytes gauge');
      lines.push(`process_memory_heap_bytes ${memoryUsage.heapUsed}`);
      lines.push('');

      lines.push('# HELP process_memory_rss_bytes Process RSS memory usage');
      lines.push('# TYPE process_memory_rss_bytes gauge');
      lines.push(`process_memory_rss_bytes ${memoryUsage.rss}`);
      lines.push('');

      lines.push('# HELP process_uptime_seconds Process uptime in seconds');
      lines.push('# TYPE process_uptime_seconds gauge');
      lines.push(`process_uptime_seconds ${Math.floor(process.uptime())}`);

      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.status(200).send(lines.join('\n'));
    },

    /**
     * 获取 JSON 格式的指标（用于调试和仪表板）
     *
     * @route GET /metrics/json
     */
    getJson: (_req: Request, res: Response): void => {
      const metrics = metricsStore.getAllStats();

      const allEndpoints = Object.entries(metrics);
      const totalRequests = allEndpoints.reduce((sum, [, stats]) => sum + (stats?.count ?? 0), 0);
      const responseTimes = allEndpoints.map(([, stats]) => stats?.avg ?? 0);
      const overallAvg =
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0;

      const slowEndpoints = allEndpoints
        .filter(([, stats]) => (stats?.avg ?? 0) > 200)
        .map(([endpoint, stats]) => ({
          endpoint,
          avgMs: stats?.avg,
          p95Ms: stats?.p95,
          p99Ms: stats?.p99,
          maxMs: stats?.max,
        }));

      res.status(200).json({
        summary: {
          totalRequests,
          overallAvgMs: overallAvg,
          endpointCount: allEndpoints.length,
          slowEndpointCount: slowEndpoints.length,
        },
        slowEndpoints,
        process: {
          uptime: Math.floor(process.uptime()),
          memoryMB: {
            heapUsed: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            heapTotal: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
            rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
          },
        },
        allMetrics: metrics,
      });
    },
  };
}
