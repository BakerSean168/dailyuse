/**
 * Goal Statistics Requests
 */

/**
 * 获取统计请求
 */
export interface GetGoalStatisticsRequest {
  accountUuid: string;
  forceRecalculate?: boolean;
}

/**
 * 重新计算统计请求
 */
export interface RecalculateGoalStatisticsRequest {
  accountUuid: string;
  force?: boolean;
}

/**
 * 初始化统计请求
 */
export interface InitializeGoalStatisticsRequest {
  accountUuid: string;
}
