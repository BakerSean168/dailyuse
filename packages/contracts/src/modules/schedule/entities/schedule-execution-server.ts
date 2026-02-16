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
  result: Record<string, any> | null; // 执行结果（JSON）
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

// ============ 实体接口 ============

/**
 * ScheduleExecution 实体 - Server 接口
 */
export interface ScheduleExecutionServer {
  // 基础属性
  id: string;
  taskId: string;
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

  /**
   * 标记执行失败
   */

  /**
   * 标记执行超时
   */

  /**
   * 标记执行跳过
   */

  /**
   * 增加重试次数
   */

  /**
   * 设置执行结果
   */

  /**
   * 设置错误信息
   */

  /**
   * 检查是否成功
   */

  /**
   * 检查是否失败
   */

  /**
   * 检查是否超时
   */

  /**
   * 检查是否跳过
   */

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */

  /**
   * 转换为 Persistence DTO (数据库)
   */
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
  }): ScheduleExecutionServer;

  /**
   * 从 Server DTO 创建实体
   */

  /**
   * 从 Persistence DTO 创建实体
   */
}
