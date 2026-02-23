/**
 * ScheduleExecution Entity - Server Interface
 * 调度执行记录实体 - 服务端接口
 */

import type { ExecutionStatus } from '../value-objects';
import type { ScheduleExecutionClientDTO } from './schedule-execution-client';

// ============ DTO 定义 ============

/**
 * ScheduleExecution Server DTO
 */
export interface ScheduleExecutionServerDTO {
  id: string;
  taskId: string;
  executionTime: number; // epoch ms
  status: ExecutionStatus;
  duration: number | null; // 执行时长（毫秒）
  result: Record<string, unknown> | null; // 执行结果（JSON）
  error: string | null; // 错误信息
  retryCount: number; // 重试次数
  createdAt: number; // epoch ms
}

/**
 * ScheduleExecution Persistence DTO (数据库映射)
 */
export interface ScheduleExecutionPersistenceDTO {
  id: string;
  taskId: string;
  executionTime: number;
  status: ExecutionStatus;
  duration: number | null;
  result: string | null; // JSON string
  error: string | null;
  retryCount: number;
  createdAt: Date;
}

/**
 * ScheduleExecution 静态工厂方法接口
 */
export interface ScheduleExecutionServerStatic {
  /**
   * 创建新的 ScheduleExecution 实体（静态工厂方法）
   */
  create(params: {
    taskId: string;
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
