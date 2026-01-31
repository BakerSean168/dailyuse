/**
 * GoalStatistics Aggregate Root - Client Interface
 * 目标统计聚合�?- 客户端接�?
 */

import type { DomainDate, TransferDate, IdentityId } from '@/primitives';
import type {
  GoalStatisticsServerDTO,
  TrendType,
  ChartData,
  TimelineData,
} from './goal-statistics-server';

// ============ DTO 定义 ============

/**
 * GoalStatistics Client DTO
 */
export interface GoalStatisticsClientDTO {
  identityId: string;
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
  averageRating: number | null;
  lastCalculatedAt: TransferDate;

  // UI 计算字段
  completionRate: number; // 完成�?0-100
  keyResultCompletionRate: number; // 关键结果完成�?0-100
  overdueRate: number; // 逾期�?0-100
  weeklyTrend: TrendType;
  monthlyTrend: TrendType;
}

// ============ 实体接口 ============

/**
 * GoalStatistics 聚合�?- Client 接口（实例方法）
 */
export interface GoalStatisticsClient {
  // 基础属�?
  identityId: IdentityId;
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
  averageRating: number | null;
  lastCalculatedAt: DomainDate;

  // UI 计算属�?
  completionRate: number;
  keyResultCompletionRate: number;
  overdueRate: number;
  weeklyTrend: TrendType;
  monthlyTrend: TrendType;

  // ===== UI 业务方法 =====

  /**
   * 获取完成度文�?
   */

  /**
   * 获取逾期文本
   */

  /**
   * 获取趋势指示�?
   */

  /**
   * 获取目标最多的分类
   */

  // ===== 图表数据方法 =====

  /**
   * 获取重要性图表数�?
   */

  /**
   * 获取状态图表数�?
   */

  /**
   * 获取进度图表数据
   */

  /**
   * 获取时间线图表数�?
   */

}

/**
 * GoalStatistics 静态工厂方法接�?
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实�?
 */
