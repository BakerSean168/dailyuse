/**
 * @file metrics.controller.ts
 * @description 指标控制器 - 提供 Prometheus 兼容格式的性能指标
 * @date 2025-12-22
 *
 * Residual 623: GET /metrics/json uses Result/HttpResponse envelope only.
 * Prometheus text (/metrics) stays text/plain for scrapers.
 *
 * RefArch Phase 6: `/metrics` exposes real cumulative Prometheus
 * counter/histogram exposition (`_bucket{le=...}` cumulative, `_sum`, `_count`)
 * keyed by the bounded method/route/status/outcome label set. The previous
 * `_avg/_p50/_p95/_p99` pseudo-histogram output is gone; quantiles remain only
 * in the `/metrics/json` debug summary. Process and operation metrics are kept.
 *
 * RefArch 阶段 6：`/metrics` 输出真实累计 Prometheus counter/histogram
 * exposition（`_bucket{le=...}` 累计、`_sum`、`_count`），以有界的
 * method/route/status/outcome label 集合为键。旧的 `_avg/_p50/_p95/_p99`
 * 伪 histogram 输出已移除；quantile 只保留在 `/metrics/json` 调试 summary 中。
 * process 与 operation metrics 保持不变。
 */

import type { Request, Response } from 'express';
import type { HttpRequestMetricsRecorder } from '../../observability/http-request-metrics';
import { escapePrometheusLabelValue } from '../../observability/http-request-metrics';
import { HTTP_REQUEST_DURATION_BUCKETS_MS } from '../../observability/http-request-metrics';
import { createApiResponseBuilder } from '../response-builder.js';
import { getUnifiedOperationMetricsSnapshot } from '@memoflow/patterns/operations';

export type MetricsJsonPayload = {
  summary: {
    totalRequests: number;
    overallAvgMs: number;
    endpointCount: number;
    slowEndpointCount: number;
  };
  slowEndpoints: Array<{
    endpoint: string;
    avgMs?: number;
    p95Ms?: number;
    p99Ms?: number;
    maxMs?: number;
  }>;
  process: {
    uptime: number;
    memoryMB: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  allMetrics: Record<
    string,
    { count: number; avg: number; p50: number; p95: number; p99: number; max: number }
  >;
  operationMetrics: Readonly<Record<string, number>>;
};

/**
 * 指标控制器
 *
 * 提供以下端点：
 * - `/metrics` - Prometheus 格式的指标输出
 * - `/metrics/json` - JSON 调试/仪表板指标（HttpResponse 信封）
 */
export function createMetricsController(metricsRecorder: HttpRequestMetricsRecorder) {
  /**
   * Escapes and quotes a Prometheus label value.
   * 转义并加引号 Prometheus label value。
   */
  const quoted = (value: string): string => `"${escapePrometheusLabelValue(value)}"`;

  return {
    /**
     * 获取 Prometheus 格式的指标
     *
     * @route GET /metrics
     */
    getPrometheus: (_req: Request, res: Response): void => {
      const lines: string[] = [];

      lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds');
      lines.push('# TYPE http_request_duration_ms histogram');
      lines.push('');
      lines.push('# HELP http_requests_total Total number of HTTP requests');
      lines.push('# TYPE http_requests_total counter');
      lines.push('');

      for (const series of metricsRecorder.getSeries()) {
        const baseLabels =
          `method=${quoted(series.method)},route=${quoted(series.route)},` +
          `status=${quoted(String(series.statusCode))},outcome=${quoted(series.outcome)}`;

        lines.push(`http_requests_total{${baseLabels}} ${series.count}`);

        // Cumulative histogram exposition: bucket counts are already cumulative
        // (each observation counts in every bucket with le >= its duration).
        for (let i = 0; i < HTTP_REQUEST_DURATION_BUCKETS_MS.length; i += 1) {
          lines.push(
            `http_request_duration_ms_bucket{${baseLabels},le=${quoted(
              String(HTTP_REQUEST_DURATION_BUCKETS_MS[i]),
            )}} ${series.buckets[i]!}`,
          );
        }
        lines.push(`http_request_duration_ms_bucket{${baseLabels},le="+Inf"} ${series.count}`);
        lines.push(`http_request_duration_ms_sum{${baseLabels}} ${Math.round(series.sumMs)}`);
        lines.push(`http_request_duration_ms_count{${baseLabels}} ${series.count}`);
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

      lines.push('');
      lines.push(
        '# HELP memoflow_operation_metrics Unified operation outbox/worker counters (P1-5)',
      );
      lines.push('# TYPE memoflow_operation_metrics counter');
      const operationMetrics = getUnifiedOperationMetricsSnapshot();
      for (const [key, value] of Object.entries(operationMetrics)) {
        lines.push(`memoflow_operation_metrics{metric="${key}"} ${value}`);
      }
      lines.push('');

      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.status(200).send(lines.join('\n'));
    },

    /**
     * 获取 JSON 格式的指标（用于调试和仪表板）
     * Residual 621/623: HttpResponse envelope (no raw dual-track body).
     * Overall average is weighted by request count, never an unweighted
     * average of endpoint averages.
     *
     * @route GET /metrics/json
     */
    getJson: (req: Request, res: Response): void => {
      const responseBuilder = createApiResponseBuilder(req);
      const seriesList = metricsRecorder.getSeries();

      const totalRequests = seriesList.reduce((sum, series) => sum + series.count, 0);
      const overallAvg =
        totalRequests > 0
          ? Math.round(seriesList.reduce((sum, series) => sum + series.sumMs, 0) / totalRequests)
          : 0;

      const slowEndpoints = seriesList
        .filter((series) => series.avgMs > 200)
        .map((series) => ({
          endpoint: `${series.method} ${series.route} ${series.statusCode} ${series.outcome}`,
          avgMs: series.avgMs,
          p95Ms: series.p95Ms,
          p99Ms: series.p99Ms,
          maxMs: series.maxMs,
        }));

      const allMetrics: MetricsJsonPayload['allMetrics'] = {};
      for (const series of seriesList) {
        allMetrics[`${series.method} ${series.route} ${series.statusCode} ${series.outcome}`] = {
          count: series.count,
          avg: series.avgMs,
          p50: series.p50Ms,
          p95: series.p95Ms,
          p99: series.p99Ms,
          max: series.maxMs,
        };
      }

      const payload: MetricsJsonPayload = {
        summary: {
          totalRequests,
          overallAvgMs: overallAvg,
          endpointCount: seriesList.length,
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
        allMetrics,
        operationMetrics: getUnifiedOperationMetricsSnapshot(),
      };

      res.status(200).json(responseBuilder.success(payload));
    },
  };
}
