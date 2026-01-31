/**
 * TaskStatistics Aggregate Root - Client Interface
 * 任务统计聚合�?- 客户端接�?
 */

import type { IdentityId, DomainDate, TransferDate } from '@/primitives';
import type {
  TaskStatisticsServerDTO,
  TemplateStatsInfo,
  InstanceStatsInfo,
  CompletionStatsInfo,
  TimeStatsInfo,
  DistributionStatsInfo,
} from './task-statistics-server';
import type { ChartDataDTO } from '../../../shared/dtos';

// ============ DTO 定义 ============

/**
 * TaskStatistics Client DTO
 */
export interface TaskStatisticsClientDTO {
  id: string;
  identityId: string;
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: TransferDate;

  // UI 扩展
  todayCompletionText: string; // "今日完成 12/15"
  weekCompletionText: string; // "本周完成 45/60"
  completionRateText: string; // "完成�?75%"
  overdueText: string; // "3 个逾期"
  efficiencyTrendText: string; // "效率提升" | "效率下降" | "保持稳定"
}

// ============ 实体接口 ============

/**
 * TaskStatistics 聚合�?- Client 接口
 */
export interface TaskStatisticsClient {
  // 基础属�?
  id: string;
  identityId: IdentityId;
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: DomainDate;

  // UI 扩展
  todayCompletionText: string;
  weekCompletionText: string;
  completionRateText: string;
  overdueText: string;
  efficiencyTrendText: string;

  // ===== UI 业务方法 =====

  /**
   * 获取今日完成�?(0-100)
   */

  /**
   * 获取本周完成�?(0-100)
   */

  /**
   * 获取效率趋势
   */

  /**
   * 获取完成率徽�?
   */

  /**
   * 获取趋势徽章
   */

  /**
   * 获取最活跃的标�?
   */

  /**
   * 获取最常用的文件夹
   */

  // ===== 图表数据方法 =====

  /**
   * 获取重要性分布图表数�?
   */

  /**
   * 获取紧急度分布图表数据
   */

  /**
   * 获取状态分布图表数�?
   */

  /**
   * 获取完成趋势图表数据
   */

}

/**
 * TaskStatistics Client 静态工厂方法接�?
 */
// ============ 辅助类型 ============

/**
 * 图表数据
 */
export type ChartData = ChartDataDTO;

/**
 * 趋势数据
 */
export interface TrendData {
  dates: string[];
  completed: number[];
  total: number[];
}
