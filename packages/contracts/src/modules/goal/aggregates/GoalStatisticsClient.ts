/**
 * GoalStatistics Aggregate Root - Client Interface
 * 目标统计聚合根 - 客户端接口
 */

import type {
  GoalStatisticsServerDTO,
  TrendType,
  ChartData,
  TimelineData,
} from './GoalStatisticsServer';

// ============ DTO 定义 ============

/**
 * GoalStatistics Client DTO
 */
export interface GoalStatisticsClientDTO {
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number;
  goalsByImportance: Record<string, number>;
  // goalsByUrgency: Record<string, number>; // REMOVED
  goalsByCategory: Record<string, number>;
  goalsByStatus: Record<string, number>;
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating?: number | null;
  lastCalculatedAt: number;

  // UI 计算字段
  completionRate: number; // 完成率 0-100
  keyResultCompletionRate: number; // 关键结果完成率 0-100
  overdueRate: number; // 逾期率 0-100
  weeklyTrend: TrendType;
  monthlyTrend: TrendType;
}

// ============ 实体接口 ============

/**
 * GoalStatistics 聚合根 - Client 接口（实例方法）
 */
export interface GoalStatisticsClient {
  // 基础属性
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number;
  goalsByImportance: Record<string, number>;
  // goalsByUrgency: Record<string, number>; // REMOVED
  goalsByCategory: Record<string, number>;
  goalsByStatus: Record<string, number>;
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating?: number | null;
  lastCalculatedAt: number;

  // UI 计算属性
  completionRate: number;
  keyResultCompletionRate: number;
  overdueRate: number;
  weeklyTrend: TrendType;
  monthlyTrend: TrendType;

  // ===== UI 业务方法 =====

  /**
   * 获取完成度文本
   */
  getCompletionText(): string;

  /**
   * 获取逾期文本
   */
  getOverdueText(): string;

  /**
   * 获取趋势指示器
   */
  getTrendIndicator(): { icon: string; color: string; text: string };

  /**
   * 获取目标最多的分类
   */
  getTopCategory(): string | null;

  // ===== 图表数据方法 =====

  /**
   * 获取重要性图表数据
   */
  getImportanceChartData(): ChartData;

  /**
   * 获取状态图表数据
   */
  getStatusChartData(): ChartData;

  /**
   * 获取进度图表数据
   */
  getProgressChartData(): ChartData;

  /**
   * 获取时间线图表数据
   */
  getTimelineChartData(): TimelineData;

  // ===== 转换方法 (To) =====
  /**
   * 转换为 Client DTO
   */}
