/**
 * Goal Review Responses
 */
import type { GoalReviewServerDTO } from '../../entities';

/**
 * 复盘响应
 */
export interface GoalReviewResponse {
  review: GoalReviewServerDTO;
}

/**
 * 复盘列表响应
 */
export interface GoalReviewsResponse {
  reviews: GoalReviewServerDTO[];
  total: number;
}
