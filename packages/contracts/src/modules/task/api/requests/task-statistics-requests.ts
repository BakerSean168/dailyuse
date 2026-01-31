/**
 * Task Statistics Requests
 * 任务统计请求类型定义
 */

/**
 * 获取任务统计请求
 */
export interface GetTaskStatisticsRequest {
  accountUuid: string;
  forceRecalculate?: boolean;
}

/**
 * 重新计算统计请求
 */
export interface RecalculateTaskStatisticsRequest {
  accountUuid: string;
  force?: boolean; // 是否强制重算（即使已存在）
}
