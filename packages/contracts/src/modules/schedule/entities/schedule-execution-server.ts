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

/**
 * ScheduleExecution 静态工厂方法接口
 */
export interface ScheduleExecutionServerStatic {
  /**
   * 创建新的 ScheduleExecution 实体（静态工厂方法）
   */
  create(params: {
    taskId: ScheduleTaskId;
    executionTime: number;
    status?: ExecutionStatus;
  }): ScheduleExecutionServerDTO;

  /**
   * 从 Server DTO 创建实体
   */

  /**
   * 从 Persistence DTO 创建实体
   */
}
