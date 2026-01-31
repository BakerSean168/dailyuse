/**
 * ScheduleTask Aggregate Root - Client Interface
 * 调度任务聚合�?- 客户端接�?
 */

import type { ScheduleTaskId, IdentityId, DomainDate, TransferDate } from '@/primitives';
import type { ScheduleTaskStatus } from '../value-objects/schedule-task-status';
import type { SourceModule } from '../value-objects/source-module';

import type {
  ScheduleExecutionClient,
  ScheduleExecutionClientDTO,
} from '../entities/schedule-execution-client';

// 从值对象导入类�?
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
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象（Client 版本�?
  schedule: ScheduleConfigClientDTO;
  execution: ExecutionInfoClientDTO;
  retryPolicy: RetryPolicyClientDTO;
  metadata: TaskMetadataClientDTO;

  // 时间�?
  createdAt: TransferDate;
  updatedAt: TransferDate;

  // UI 辅助属�?
  statusDisplay: string; // "活跃" | "暂停" | "完成" | "取消" | "失败"
  statusColor: string; // "green" | "gray" | "blue" | "red" | "orange"
  sourceModuleDisplay: string; // "提醒模块" | "任务模块"
  enabledDisplay: string; // "启用" | "禁用"
  nextRunAtFormatted: string; // "2025-10-12 14:30:00"
  lastRunAtFormatted: string; // "2025-10-11 14:30:00"
  executionSummary: string; // "已执�?10 次，成功 8 �?
  healthStatus: string; // "healthy" | "warning" | "critical"
  isOverdue: boolean; // 是否过期

  // ===== 子实�?DTO =====
  executions: ScheduleExecutionClientDTO[] | null;
}

// ============ 实体接口 ============

/**
 * ScheduleTask 聚合�?- Client 接口
 */
export interface ScheduleTaskClient {
  // 基础属�?
  id: ScheduleTaskId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象（Client 版本�?
  schedule: ScheduleConfigClient;
  execution: ExecutionInfoClient;
  retryPolicy: RetryPolicyClient;
  metadata: TaskMetadataClient;

  // 时间�?
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // UI 辅助属�?
  statusDisplay: string;
  statusColor: string;
  sourceModuleDisplay: string;
  enabledDisplay: string;
  nextRunAtFormatted: string;
  lastRunAtFormatted: string;
  executionSummary: string;
  healthStatus: string;
  isOverdue: boolean;

  // ===== 子实体集�?=====
  executions: ScheduleExecutionClient[] | null;


}

