/**
 * TaskStatistics Aggregate Root - Client Interface
 * 任务统计聚合根 - 客户端接口
 */

import type {
  TaskStatisticsServerDTO,
  TemplateStatsInfo,
  InstanceStatsInfo,
  CompletionStatsInfo,
  TimeStatsInfo,
  DistributionStatsInfo,
} from './TaskStatisticsServer';
import type { ChartDataDTO } from '../../../shared/dtos';

// ============ DTO 定义 ============

/**
 * TaskStatistics Client DTO
 */
export interface TaskStatisticsClientDTO {
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: number;

  // UI 扩展
  todayCompletionText: string; // "今日完成 12/15"
  weekCompletionText: string; // "本周完成 45/60"
  completionRateText: string; // "完成率 75%"
  overdueText: string; // "3 个逾期"
  efficiencyTrendText: string; // "效率提升" | "效率下降" | "保持稳定"
}

// ============ 实体接口 ============

/**
 * TaskStatistics 聚合根 - Client 接口
 */
export interface TaskStatisticsClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: number;

  // UI 扩展
  todayCompletionText: string;
  weekCompletionText: string;
  completionRateText: string;
  overdueText: string;
  efficiencyTrendText: string;

  // ===== UI 业务方法 =====

  /**
   * 获取今日完成率 (0-100)
   */
  getTodayCompletionRate(): number;

  /**
   * 获取本周完成率 (0-100)
   */
  getWeekCompletionRate(): number;

  /**
   * 获取效率趋势
   */
  getEfficiencyTrend(): 'UP' | 'DOWN' | 'STABLE';

  /**
   * 获取完成率徽章
   */
  getCompletionBadge(): { text: string; color: string; icon: string };

  /**
   * 获取趋势徽章
   */
  getTrendBadge(): { text: string; color: string; icon: string };

  /**
   * 获取最活跃的标签
   */
  getTopTag(): string | null;

  /**
   * 获取最常用的文件夹
   */
  getTopFolder(): string | null;

  // ===== 图表数据方法 =====

  /**
   * 获取重要性分布图表数据
   */
  getImportanceChartData(): ChartData;

  /**
   * 获取紧急度分布图表数据
   */
  getUrgencyChartData(): ChartData;

  /**
   * 获取状态分布图表数据
   */
  getStatusChartData(): ChartData;

  /**
   * 获取完成趋势图表数据
   */
  getCompletionTrendData(): TrendData;

}
