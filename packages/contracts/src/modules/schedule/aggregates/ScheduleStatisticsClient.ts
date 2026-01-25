/**
 * ScheduleStatistics Aggregate Root - Client Interface
 * 调度统计聚合根 - 客户端接口
 */

import type { ScheduleStatisticsServerDTO } from './ScheduleStatisticsServer';
import type { ModuleStatisticsClientDTO, ModuleStatisticsServerDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleStatistics Client DTO
 */
export interface ScheduleStatisticsClientDTO {
  uuid: string; // 使用 accountUuid 作为 uuid
  accountUuid: string;

  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;

  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  timeoutExecutions: number;

  // 性能统计
  avgExecutionDuration: number;
  minExecutionDuration: number;
  maxExecutionDuration: number;

  // 模块统计（Client 版本）
  moduleStatistics: Record<string, ModuleStatisticsClientDTO>;

  // 时间戳
  lastUpdatedAt: number;
  createdAt: number;

  // UI 辅助属性
  totalTasksDisplay: string; // "共 100 个任务"
  activeTasksDisplay: string; // "80 个活跃"
  successRateDisplay: string; // "98.5%"
  avgDurationDisplay: string; // "1.2 秒"
  healthStatus: string; // "healthy" | "warning" | "critical"
}

// ============ 实体接口 ============

/**
 * ScheduleStatistics 聚合根 - Client 接口
 */
export interface ScheduleStatisticsClient {
  // 基础属性
  uuid: string;
  accountUuid: string;

  // 任务统计
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  failedTasks: number;

  // 执行统计
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  timeoutExecutions: number;

  // 性能统计
  avgExecutionDuration: number;
  minExecutionDuration: number;
  maxExecutionDuration: number;

  // 模块统计
  moduleStatistics: Record<string, ModuleStatisticsClientDTO>;

  // 时间戳
  lastUpdatedAt: Date;
  createdAt: Date;

  // UI 辅助属性
  totalTasksDisplay: string;
  activeTasksDisplay: string;
  successRateDisplay: string;
  avgDurationDisplay: string;
  healthStatus: string;

  // ===== 业务方法 =====

  // 获取模块统计
  getModuleStats(moduleName: string): ModuleStatisticsClientDTO | null;
  getAllModuleStats(): ModuleStatisticsClientDTO[];

  // 计算方法
  calculateSuccessRate(): number;
  calculateFailureRate(): number;
  calculateHealthScore(): number;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ScheduleStatisticsServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): ScheduleStatisticsClientDTO;
}

/**
 * ScheduleStatistics 静态工厂方法接口
 */
export interface ScheduleStatisticsClientStatic {
  /**
   * 从 Server DTO 创建客户端实体
   */
  fromServerDTO(dto: ScheduleStatisticsServerDTO): ScheduleStatisticsClient;

  /**
   * 从 Client DTO 创建客户端实体
   */
  fromClientDTO(dto: ScheduleStatisticsClientDTO): ScheduleStatisticsClient;
}
