/**
 * ScheduleExecution Entity - Server Interface
 * 调度执行记录实体 - 服务端接口
 */

import type { ScheduleExecutionId, ScheduleTaskId } from '../../../primitives';
import type { ExecutionStatus } from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleExecution Server DTO
 */
export interface ScheduleExecutionServerDTO {
  id: ScheduleExecutionId;
  taskId: ScheduleTaskId;
  executionTime: number; // epoch ms
  status: ExecutionStatus;
  duration: number | null; // 执行时长（毫秒）
  result: Record<string, unknown> | null; // 执行结果（JSON）
  error: string | null; // 错误信息
  retryCount: number; // 重试次数
  createdAt: number; // epoch ms
}

// Residual 653: ScheduleExecutionServerStatic factory dual retired.
