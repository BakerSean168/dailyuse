/**
 * Generate Key Results Request
 * 生成关键结果请求DTO
 */

/**
 * 生成关键结果请求
 */
export interface GenerateKeyResultsRequest {
  /** 目标标题 */
  goalTitle: string;
  /** 目标描述（可选） */
  goalDescription?: string;
  /** 开始日期时间戳 */
  startDate: number;
  /** 结束日期时间戳 */
  endDate: number;
  /** 额外上下文信息（可选） */
  goalContext?: string;
}
