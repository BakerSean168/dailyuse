/**
 * ScheduleExecution Entity - Client Interface
 * 调度执行记录实体 - 客户端接口
 */

import type { ExecutionStatus } from '../enums';
import type { ScheduleExecutionServerDTO } from './ScheduleExecutionServer';

// ============ DTO 定义 ============

/**
 * ScheduleExecution Client DTO
 */
export interface ScheduleExecutionClientDTO {
  uuid: string;
  taskUuid: string;
  executionTime: number;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, any> | null;
  error: string | null;
  retryCount: number;
  createdAt: number;

  // UI 辅助属性
  executionTimeFormatted: string; // "2025-10-12 14:30:00"
  statusDisplay: string; // "成功" | "失败" | "跳过" | "超时" | "重试中"
  statusColor: string; // "green" | "red" | "gray" | "orange" | "blue"
  durationFormatted: string; // "1.2 秒" | "500 毫秒" | "-"
  hasError: boolean;
  hasResult: boolean;
  resultSummary: string; // "3 个字段" | "空"
}

// ============ 实体接口 ============

/**
 * ScheduleExecution 实体 - Client 接口
 */
export interface ScheduleExecutionClient {
  // 基础属性
  uuid: string;
  taskUuid: string;
  executionTime: number;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, any> | null;
  error: string | null;
  retryCount: number;
  createdAt: Date;

  // UI 辅助属性
  executionTimeFormatted: string;
  statusDisplay: string;
  statusColor: string;
  durationFormatted: string;
  hasError: boolean;
  hasResult: boolean;
  resultSummary: string;

  // ===== 业务方法 =====

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

  /**
   * 检查是否正在重试
   */
  isRetrying(): boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ScheduleExecutionServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): ScheduleExecutionClientDTO;
}

/**
 * ScheduleExecution 静态工厂方法接口
 */
export interface ScheduleExecutionClientStatic {
  /**
   * 从 Server DTO 创建客户端实体
   */
  fromServerDTO(dto: ScheduleExecutionServerDTO): ScheduleExecutionClient;

  /**
   * 从 Client DTO 创建客户端实体
   */
  fromClientDTO(dto: ScheduleExecutionClientDTO): ScheduleExecutionClient;
}
