/**
 * GoalStatistics Aggregate Root - Server Interface
 * 目标统计聚合�?- 服务端接�?
 */

import type { DomainDate, TransferDate, PersistenceDate, IdentityId } from '@/primitives';
import type { GoalStatisticsClientDTO } from './goal-statistics-client';
import type { ChartDataDTO } from '../../../shared/dtos';

// ============ 辅助类型 ============

/**
 * 图表数据
 */
export type ChartData = ChartDataDTO;

/**
 * 时间线数�?
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
  identityId: string;
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
  averageRating: number | null; // 平均评分 1-5
  lastCalculatedAt: TransferDate;
}

/**
 * GoalStatistics Persistence DTO
 * 注意：使�?camelCase 命名
 */
export interface GoalStatisticsPersistenceDTO {
  identityId: string;
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
  averageRating: number | null;
  lastCalculatedAt: PersistenceDate;
}

// 事件定义已移�?protocol/goal-event-map.ts

// ============ 实体接口 ============

/**
 * GoalStatistics 聚合�?- Server 接口（实例方法）
 */
export interface GoalStatisticsServer {
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

  // 业务方法
  recalculate(goals: any[]): void;
  getCompletionRate(): number;
  getAverageGoalsPerMonth(): number;

}

/**
 * GoalStatistics 静态工厂方法接�?
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实�?
 */
