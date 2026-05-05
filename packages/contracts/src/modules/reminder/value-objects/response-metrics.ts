/**
 * Response Metrics Value Object
 * 响应指标值对象
 */

// ============ DTO 定义 ============

/**
 * Response Metrics DTO
 * 提醒响应指标
 */
export interface ResponseMetricsDTO {
  readonly clickRate: number; // 点击率 (0-100)
  readonly ignoreRate: number; // 忽略率 (0-100)
  readonly avgResponseTime: number; // 平均响应时间（秒）
  readonly snoozeCount: number; // 延迟次数
  readonly effectivenessScore: number; // 效果评分 (0-100)
  readonly sampleSize: number; // 样本数量（最近 N 次）
  readonly lastAnalysisTime: number; // 最后分析时间 (epoch ms)
}

// ============ 实体接口 ============

/**
 * Response Metrics 值对象接口
 */
export interface ResponseMetrics {
  readonly clickRate: number;
  readonly ignoreRate: number;
  readonly avgResponseTime: number;
  readonly snoozeCount: number;
  readonly effectivenessScore: number;
  readonly sampleSize: number;
  readonly lastAnalysisTime: number;
}
