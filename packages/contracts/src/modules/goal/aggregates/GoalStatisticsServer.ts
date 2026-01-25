/**
 * GoalStatistics Aggregate Root - Server Interface
 * 目标统计聚合根 - 服务端接口
 */

import type { GoalStatisticsClientDTO } from './GoalStatisticsClient';
import type { ChartDataDTO } from '../../../shared/dtos';

// ============ 辅助类型 ============

/**
 * 图表数据
 */
export type ChartData = ChartDataDTO;

/**
 * 时间线数据
 */
export interface TimelineData {
  dates: string[];
  created: number[];
  completed: number[];
}

/**
 * 趋势类型
 */
export type TrendType = 'UP' | 'DOWN' | 'STABLE';

// ============ DTO 定义 ============

/**
 * GoalStatistics Server DTO
 */
export interface GoalStatisticsServerDTO {
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number; // 平均进度 0-100
  goalsByImportance: Record<string, number>;
  // goalsByUrgency: Record<string, number>; // REMOVED
  goalsByCategory: Record<string, number>;
  goalsByStatus: Record<string, number>;
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating?: number | null; // 平均评分 1-5
  lastCalculatedAt: number; // epoch ms
}

/**
 * GoalStatistics Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface GoalStatisticsPersistenceDTO {
  accountUuid: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  archivedGoals: number;
  overdueGoals: number;
  totalKeyResults: number;
  completedKeyResults: number;
  averageProgress: number;
  goalsByImportance: string; // JSON string
  // goalsByUrgency: string; // REMOVED - JSON string
  goalsByCategory: string; // JSON string
  goalsByStatus: string; // JSON string
  goalsCreatedThisWeek: number;
  goalsCompletedThisWeek: number;
  goalsCreatedThisMonth: number;
  goalsCompletedThisMonth: number;
  totalReviews: number;
  averageRating?: number | null;
  lastCalculatedAt: number;
}

// ============ 领域事件 ============

/**
 * 统计重新计算事件
 */
export interface GoalStatisticsRecalculatedEvent {
  type: 'goal_statistics.recalculated';
  aggregateId: string; // GoalStatistics 聚合根的 uuid
  timestamp: Date;
  payload: {
    statistics: GoalStatisticsServerDTO;
    previousStatistics?: GoalStatisticsServerDTO;
  };
}

// ============ 实体接口 ============

/**
 * GoalStatistics 聚合根 - Server 接口（实例方法）
 */
export interface GoalStatisticsServer {
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

  // 业务方法
  recalculate(goals: any[]): void;
  getCompletionRate(): number;
  getAverageGoalsPerMonth(): number;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): GoalStatisticsServerDTO;

  toClientDTO(): GoalStatisticsClientDTO;
  /**
   * 转换为 Persistence DTO
   */
  toPersistenceDTO(): GoalStatisticsPersistenceDTO;
}

/**
 * GoalStatistics 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface GoalStatisticsServerStatic {
  /**
   * 创建新的 GoalStatistics 聚合根（静态工厂方法）
   * @param accountUuid 账户 UUID
   * @returns 新的 GoalStatistics 实例
   */
  createDefault(accountUuid: string): GoalStatisticsServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: GoalStatisticsServerDTO): GoalStatisticsServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: GoalStatisticsPersistenceDTO): GoalStatisticsServer;
}
