/**
 * Goal Review Requests
 */

/**
 * 创建复盘请求
 */
export interface CreateGoalReviewRequest {
  goalUuid: string;
  title: string;
  content: string;
  reviewType: string;
  rating?: number;
  achievements?: string;
  challenges?: string;
  nextActions?: string;
  reviewedAt?: number;
}

/**
 * 更新复盘请求
 */
export interface UpdateGoalReviewRequest {
  title?: string;
  content?: string;
  rating?: number;
  achievements?: string;
  challenges?: string;
  nextActions?: string;
}
