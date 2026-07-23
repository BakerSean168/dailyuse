/**
 * ScheduleTask Aggregate Root - Server Interface
 * 调度任务聚合根 - 服务端接口
 */

import type { ScheduleTaskId, IdentityId } from '../../../primitives';
import type { ScheduleExecutionServerDTO } from '../entities/schedule-execution-server';
import type {
  ScheduleTaskStatus,
  SourceModule,
  ScheduleConfigDTO,
  ExecutionInfoDTO,
  RetryPolicyDTO,
  TaskMetadataDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleTask Server DTO
 */
export interface ScheduleTaskServerDTO {
  id: ScheduleTaskId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;

  // 值对象
  schedule: ScheduleConfigDTO;
  execution: ExecutionInfoDTO;
  retryPolicy: RetryPolicyDTO;
  metadata: TaskMetadataDTO;

  // 时间戳
  version: number;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt: number | null; // epoch ms

  // ===== 子实体 DTO (聚合根包含子实体) =====
  executions?: ScheduleExecutionServerDTO[] | null; // 执行记录列表（可选加载）
}

// ============ 领域事件 ============
// 事件接口已迁移至 domain/events/ 目录（payload-only 格式）
// Residual 653: ScheduleTaskServerStatic factory dual retired (domain class owns factories).
