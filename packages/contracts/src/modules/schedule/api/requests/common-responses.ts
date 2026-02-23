/**
 * Schedule Common Responses
 * 调度模块通用响应
 */

// ============ Common Response Types ============

/**
 * 操作成功响应
 */
export interface ScheduleOperationSuccessResponseDTO {
  readonly ok: boolean;
  readonly message: string;
  readonly data?: unknown;
}

/**
 * 错误响应
 */
export interface ScheduleErrorResponseDTO {
  readonly ok: false;
  readonly error: string;
  readonly code?: string;
  readonly details?: unknown;
}
