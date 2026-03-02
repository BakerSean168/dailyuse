/**
 * ScheduleExecution Entity - Client Interface
 * 调度执行记录实体 - 客户端接?
 */

import type { ScheduleExecutionId, ScheduleTaskId, DomainDate, TransferDate } from '../../../primitives';
import type { ExecutionStatus } from '../value-objects/execution-status';
import type { ScheduleExecutionServerDTO } from './schedule-execution-server';

// ============ DTO 定义 ============

/**
 * ScheduleExecution Client DTO
 */
export interface ScheduleExecutionClientDTO {
  id: ScheduleExecutionId;
  scheduleTaskId: ScheduleTaskId;
  executionTime: TransferDate;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, unknown> | null;
  error: string | null;
  retryCount: number;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // UI 辅助属?
  executionTimeFormatted: string;
  statusDisplay: string;
  statusColor: string;
  durationFormatted: string;
  hasError: boolean;
  hasResult: boolean;
  resultSummary: string;
}

/**
 * ScheduleExecution 静态工厂方法接?
 */
