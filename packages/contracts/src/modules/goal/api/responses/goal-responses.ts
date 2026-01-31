/**
 * Goal Responses
 */

import type { GoalClientDTO, GoalStatisticsClientDTO, GoalRecordClientDTO } from '../../aggregates';
import type { KeyResultClientDTO, GoalReviewClientDTO } from '../../entities';
import type { BatchOperationResponseDTO } from '../../../../shared/dtos';

/**
 * 目标响应
 */
export interface GoalResponse {
  goal: GoalClientDTO;
}

/**
 * 目标列表响应
 */
export interface GoalsResponse {
  goals: GoalClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 批量操作响应
 */
export type BatchOperationResponse = BatchOperationResponseDTO;

/**
 * 目标聚合视图响应
 */
export interface GoalAggregateViewResponse {
  goal: GoalClientDTO;
  keyResults?: KeyResultClientDTO[];
  records?: GoalRecordClientDTO[];
  reviews?: GoalReviewClientDTO[];
  statistics?: {
    totalKeyResults: number;
    completedKeyResults: number;
    totalRecords: number;
    totalReviews: number;
    overallProgress: number;
  };
}
