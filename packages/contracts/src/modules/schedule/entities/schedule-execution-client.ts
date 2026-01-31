/**
 * ScheduleExecution Entity - Client Interface
 * 调度执行记录实体 - 客户端接�?
 */

import type { ScheduleExecutionId, ScheduleTaskId, DomainDate, TransferDate } from '@/primitives';
import type { ExecutionStatus } from '../value-objects/execution-status';
import type { ScheduleExecutionServerDTO } from './schedule-execution-server';

// ============ DTO 定义 ============

/**
 * ScheduleExecution Client DTO
 */
export interface ScheduleExecutionClientDTO {
  id: string;
  scheduleTaskId: string;
  executionTime: TransferDate;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, any> | null;
  error: string | null;
  retryCount: number;
  createdAt: TransferDate;

  // UI 辅助属�?
  executionTimeFormatted: string;
  statusDisplay: string;
  statusColor: string;
  durationFormatted: string;
  hasError: boolean;
  hasResult: boolean;
  resultSummary: string;
}

// ============ 实体接口 ============

/**
 * ScheduleExecution 实体 - Client 接口
 */
export interface ScheduleExecutionClient {
  // 基础属�?
  id: ScheduleExecutionId;
  scheduleTaskId: ScheduleTaskId;
  executionTime: DomainDate;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, any> | null;
  error: string | null;
  retryCount: number;
  createdAt: DomainDate;

  // UI 辅助属�?
  executionTimeFormatted: string;
  statusDisplay: string;
  statusColor: string;
  durationFormatted: string;
  hasError: boolean;
  hasResult: boolean;
  resultSummary: string;

  // ===== 业务方法 =====

  /**
   * 检查是否成�?
   */
  isSuccess(): boolean;

  /**
   * 检查是否失�?
   */
  isFailed(): boolean;

  /**
   * 检查是否超�?
   */
  isTimeout(): boolean;

  /**
   * 检查是否跳�?
   */
  isSkipped(): boolean;

  /**
   * 检查是否正在重�?
   */
  isRetrying(): boolean;

}

/**
 * ScheduleExecution 静态工厂方法接�?
 */
