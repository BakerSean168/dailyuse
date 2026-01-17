/**
 * Goal Record Requests
 */

/**
 * 创建目标记录请求
 */
export interface CreateGoalRecordRequest {
  value: number;
  note?: string;
  recordedAt?: number;
}
