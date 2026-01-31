/**
 * Generate Tasks Request
 * 生成任务模板请求DTO
 */

/**
 * 生成任务模板请求
 */
export interface GenerateTasksRequest {
  /** 关键结果标题 */
  keyResultTitle: string;
  /** 关键结果描述（可选） */
  keyResultDescription?: string;
  /** 目标值 */
  targetValue: number;
  /** 当前值 */
  currentValue: number;
  /** 单位（可选） */
  unit?: string;
  /** 剩余时间（天数） */
  timeRemaining: number;
}
