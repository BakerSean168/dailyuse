/**
 * Goal Statistics Responses
 */
import type { GoalStatisticsClientDTO, GoalStatisticsServerDTO } from '../../aggregates';

/**
 * 统计响应
 */
export interface GoalStatisticsResponse {
  statistics: GoalStatisticsClientDTO;
}

/**
 * 重新计算统计响应
 */
export interface RecalculateGoalStatisticsResponse {
  ok: boolean;
  message: string;
  statistics: GoalStatisticsServerDTO;
}

/**
 * 初始化统计响应
 */
export interface InitializeGoalStatisticsResponse {
  ok: boolean;
  message: string;
  statistics: GoalStatisticsServerDTO;
}
