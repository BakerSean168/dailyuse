/**
 * ScheduleTask Aggregate Root - Server Interface
 * 调度任务聚合根 - 服务端接口
 */

import type { ScheduleTaskId, IdentityId } from '../../../primitives';
import type { ScheduleTaskClientDTO } from './schedule-task-client';
import type { ScheduleExecutionServerDTO } from '../entities/schedule-execution-server';
import type {
  ScheduleTaskStatus,
  SourceModule,
  ExecutionStatus,
  IScheduleConfig,
  ScheduleConfigDTO,
  IExecutionInfo,
  ExecutionInfoDTO,
  IRetryPolicy,
  RetryPolicyDTO,
  ITaskMetadata,
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
// Event interfaces migrated to domain/events/ directory (payload-only format)

/**
 * ScheduleTask 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface ScheduleTaskServerStatic {
  /**
   * 创建新的 ScheduleTask 聚合根（静态工厂方法）
   * @param params 创建参数
   * @returns 新的 ScheduleTask 实例
   */
  create(params: {
    identityId: IdentityId;
    name: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    schedule: ScheduleConfigDTO;
    description?: string;
    metadata?: Partial<TaskMetadataDTO>;
    retryPolicy?: Partial<RetryPolicyDTO>;
  }): ScheduleTaskServerDTO;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */

  /**
   * 从 Persistence DTO 创建实体
   * 注意：需要单独加载子实体
   */
}
