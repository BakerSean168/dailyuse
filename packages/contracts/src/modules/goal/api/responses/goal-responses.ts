/**
 * Goal Responses
 */

import type { GoalClientDTO } from '../../aggregates';
import type { KeyResultClientDTO, GoalReviewClientDTO, GoalRecordClientDTO } from '../../entities';


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
