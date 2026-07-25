/**
 * Response Metrics Value Object
 * 响应指标值对象
 *
 * Residual 857: ResponseMetricsDTO dual retired — sole ResponseMetrics interface + type alias.
 */

// Residual 857: sole ResponseMetrics body.
export interface ResponseMetrics {
  readonly clickRate: number; // 0-100
  readonly ignoreRate: number; // 0-100
  readonly avgResponseTime: number; // seconds
  readonly snoozeCount: number;
  readonly effectivenessScore: number; // 0-100
  readonly sampleSize: number;
  readonly lastAnalysisTime: number; // epoch ms
}

// Residual 857: ResponseMetricsDTO dual retired — DTO is the ResponseMetrics shape.
export type ResponseMetricsDTO = ResponseMetrics;
