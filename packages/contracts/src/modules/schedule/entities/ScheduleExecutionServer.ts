/**
 * ScheduleExecution Entity - Server Interface
 * 调度执行记录实体 - 服务端接口
 */

import type { ExecutionStatus } from '../enums';
import type { ScheduleExecutionClientDTO } from './ScheduleExecutionClient';

// ============ DTO 定义 ============

/**
 * ScheduleExecution Server DTO
 */
export interface ScheduleExecutionServerDTO {
  uuid: string;
  taskUuid: string;
  executionTime: number; // epoch ms
  status: ExecutionStatus;
  duration: number | null; // 执行时长（毫秒）
  result: Record<string, any> | null; // 执行结果（JSON）
  error: string | null; // 错误信息
  retryCount: number; // 重试次数
  createdAt: number; // epoch ms
}

/**
 * ScheduleExecution Persistence DTO (数据库映射)
 */
export interface ScheduleExecutionPersistenceDTO {
  uuid: string;
  taskUuid: string;
  executionTime: number;
  status: ExecutionStatus;
  duration: number | null;
  result: string | null; // JSON string
  error: string | null;
  retryCount: number;
  createdAt: Date;
}

// ============ 实体接口 ============

/**
 * ScheduleExecution 实体 - Server 接口
 */
export interface ScheduleExecutionServer {
  // 基础属性
  uuid: string;
  taskUuid: string;
  executionTime: number;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, any> | null;
  error: string | null;
  retryCount: number;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;

  // ===== 业务方法 =====

  /**
   * 标记执行成功
   */
  markSuccess(duration: number, result?: Record<string, any>): void;

  /**
   * 标记执行失败
   */
  markFailed(error: string, duration?: number): void;

  /**
   * 标记执行超时
   */
  markTimeout(duration: number): void;

  /**
   * 标记执行跳过
   */
  markSkipped(reason: string): void;

  /**
   * 增加重试次数
   */
  incrementRetry(): void;

  /**
   * 设置执行结果
   */
  setResult(result: Record<string, any>): void;

  /**
   * 设置错误信息
   */
  setError(error: string): void;

  /**
   * 检查是否成功
   */
  isSuccess(): boolean;

  /**
   * 检查是否失败
   */
  isFailed(): boolean;

  /**
   * 检查是否超时
   */
  isTimeout(): boolean;

  /**
   * 检查是否跳过
   */
  isSkipped(): boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */}
