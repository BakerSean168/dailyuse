/**
 * ScheduleTask Aggregate Root - Client Interface
 * 调度任务聚合根 - 客户端接口
 */

import type { ScheduleTaskStatus, SourceModule, ExecutionStatus } from '../enums';
import type { ScheduleTaskServerDTO } from './ScheduleTaskServer';
import type {
  ScheduleExecutionClient,
  ScheduleExecutionClientDTO,
} from '../entities/ScheduleExecutionClient';

// 从值对象导入类型
import type {
  ScheduleConfigClient,
  ScheduleConfigServerDTO,
  ScheduleConfigClientDTO,
  ExecutionInfoClient,
  ExecutionInfoServerDTO,
  ExecutionInfoClientDTO,
  RetryPolicyClient,
  RetryPolicyServerDTO,
  RetryPolicyClientDTO,
  TaskMetadataClient,
  TaskMetadataServerDTO,
  TaskMetadataClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleTask Client DTO
 */
export interface ScheduleTaskClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象（Client 版本）
  schedule: ScheduleConfigClientDTO;
  execution: ExecutionInfoClientDTO;
  retryPolicy: RetryPolicyClientDTO;
  metadata: TaskMetadataClientDTO;

  // 时间戳
  createdAt: number;
  updatedAt: number;

  // UI 辅助属性
  statusDisplay: string; // "活跃" | "暂停" | "完成" | "取消" | "失败"
  statusColor: string; // "green" | "gray" | "blue" | "red" | "orange"
  sourceModuleDisplay: string; // "提醒模块" | "任务模块"
  enabledDisplay: string; // "启用" | "禁用"
  nextRunAtFormatted: string; // "2025-10-12 14:30:00"
  lastRunAtFormatted: string; // "2025-10-11 14:30:00"
  executionSummary: string; // "已执行 10 次，成功 8 次"
  healthStatus: string; // "healthy" | "warning" | "critical"
  isOverdue: boolean; // 是否过期

  // ===== 子实体 DTO =====
  executions?: ScheduleExecutionClientDTO[] | null;
}

// ============ 实体接口 ============

/**
 * ScheduleTask 聚合根 - Client 接口
 */
export interface ScheduleTaskClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象（Client 版本）
  schedule: ScheduleConfigClient;
  execution: ExecutionInfoClient;
  retryPolicy: RetryPolicyClient;
  metadata: TaskMetadataClient;

  // 时间戳
  createdAt: Date;
  updatedAt: Date;

  // UI 辅助属性
  statusDisplay: string;
  statusColor: string;
  sourceModuleDisplay: string;
  enabledDisplay: string;
  nextRunAtFormatted: string;
  lastRunAtFormatted: string;
  executionSummary: string;
  healthStatus: string;
  isOverdue: boolean;

  // ===== 子实体集合 =====
  executions?: ScheduleExecutionClient[] | null;

  // ===== 业务方法 =====

  // 状态检查
  isActive(): boolean;
  isPaused(): boolean;
  isCompleted(): boolean;
  isCancelled(): boolean;
  isFailed(): boolean;
  isExpired(): boolean;

  // 获取执行记录
  getRecentExecutions(limit: number): ScheduleExecutionClient[];
  getFailedExecutions(): ScheduleExecutionClient[];

}
