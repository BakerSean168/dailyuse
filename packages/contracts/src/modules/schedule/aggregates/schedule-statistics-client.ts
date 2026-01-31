/**
 * ScheduleStatistics Aggregate Root - Client Interface
 * 调度统计聚合�?- 客户端接�?
 */

import type { IdentityId, DomainDate, TransferDate } from '@/primitives';
import type { ScheduleStatisticsServerDTO } from './schedule-statistics-server';
import type { ModuleStatisticsClientDTO, ModuleStatisticsServerDTO } from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleStatistics Client DTO
 */
export interface ScheduleStatisticsClientDTO {
  id: string; // 使用 identityId 作为 id
  identityId: string;

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

  // 模块统计（Client 版本�?
  moduleStatistics: Record<string, ModuleStatisticsClientDTO>;

  // 时间�?
  lastUpdatedAt: TransferDate;
  createdAt: TransferDate;

  // UI 辅助属�?
  totalTasksDisplay: string;
  activeTasksDisplay: string;
  successRateDisplay: string;
  avgDurationDisplay: string;
  healthStatus: string;
}

// ============ 实体接口 ============

/**
 * ScheduleStatistics 聚合�?- Client 接口
 */
export interface ScheduleStatisticsClient {
  // 基础属�?
  id: string;
  identityId: IdentityId;

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

  // 时间�?
  lastUpdatedAt: DomainDate;
  createdAt: DomainDate;

  // UI 辅助属�?
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

}

/**
 * ScheduleStatistics 静态工厂方法接�?
 */
