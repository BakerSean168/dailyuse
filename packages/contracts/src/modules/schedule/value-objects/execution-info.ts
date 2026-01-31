/**
 * Execution Info Value Object
 * 执行信息值对�?
 */

import type { ExecutionStatus } from './execution-status';

// ============ 接口定义 ============

/**
 * 执行信息 - Server 接口
 */
export interface IExecutionInfoServer {
  /** 下次执行时间 */
  nextRunAt: number | null;

  /** 上次执行时间 */
  lastRunAt: number | null;

  /** 已执行次�?*/
  executionCount: number;

  /** 上次执行状�?*/
  lastExecutionStatus: ExecutionStatus | null;

  /** 上次执行时长（毫秒） */
  lastExecutionDuration: number | null;

  /** 连续失败次数 */
  consecutiveFailures: number;

  // 值对象方�?
  equals(other: IExecutionInfoServer): boolean;
  with(
    updates: Partial<
      Omit<
        IExecutionInfoServer,
        | 'equals'
        | 'with'
        | 'updateAfterExecution'
        | 'resetFailures'
        | 'toServerDTO'
        | 'toClientDTO'
        | 'toPersistenceDTO'
      >
    >,
  ): IExecutionInfoServer;
  updateAfterExecution(params: {
    executedAt: number;
    status: ExecutionStatus;
    duration: number;
    nextRunAt: number | null;
  }): IExecutionInfoServer;
  resetFailures(): IExecutionInfoServer;

  // DTO 转换方法
}

/**
 * 执行信息 - Client 接口
 */
export interface IExecutionInfoClient {
  /** 下次执行时间 */
  nextRunAt: Date | null;

  /** 上次执行时间 */
  lastRunAt: Date | null;

  /** 已执行次�?*/
  executionCount: number;

  /** 上次执行状�?*/
  lastExecutionStatus: ExecutionStatus | null;

  /** 连续失败次数 */
  consecutiveFailures: number;

  // UI 辅助属�?
  /** 下次执行时间格式�?*/
  nextRunAtFormatted: string | null; // "2025-01-01 09:00" | "30 分钟�?

  /** 上次执行时间格式�?*/
  lastRunAtFormatted: string | null; // "2 小时�?

  /** 上次执行时长格式�?*/
  lastExecutionDurationFormatted: string | null; // "1.2 �?

  /** 执行次数格式�?*/
  executionCountFormatted: string; // "已执�?100 �?

  /** 健康状�?*/
  healthStatus: 'healthy' | 'warning' | 'critical'; // 基于连续失败次数

  // 值对象方�?
  equals(other: IExecutionInfoClient): boolean;

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * Execution Info Server DTO
 */
export interface ExecutionInfoServerDTO {
  nextRunAt: string | null; // ISO string
  lastRunAt: string | null;
  executionCount: number;
  lastExecutionStatus: ExecutionStatus | null;
  lastExecutionDuration: number | null;
  consecutiveFailures: number;
}

/**
 * Execution Info Client DTO
 */
export interface ExecutionInfoClientDTO {
  nextRunAt: string | null;
  lastRunAt: string | null;
  executionCount: number;
  lastExecutionStatus: ExecutionStatus | null;
  consecutiveFailures: number;
  nextRunAtFormatted: string | null;
  lastRunAtFormatted: string | null;
  lastExecutionDurationFormatted: string | null;
  executionCountFormatted: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * Execution Info Persistence DTO
 */
export interface ExecutionInfoPersistenceDTO {
  nextRunAt: string | null;
  lastRunAt: string | null;
  executionCount: number;
  lastExecutionStatus: string | null;
  last_execution_duration: number | null;
  consecutive_failures: number;
}

// ============ 类型导出 ============

export type ExecutionInfoServer = IExecutionInfoServer;
export type ExecutionInfoClient = IExecutionInfoClient;
