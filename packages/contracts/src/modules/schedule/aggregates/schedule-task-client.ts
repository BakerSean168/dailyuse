/**
 * ScheduleTask Aggregate Root - Client Interface
 * 调度任务聚合?- 客户端接?
 */

import type { ScheduleTaskId, IdentityId, TransferDate } from '../../../primitives';
import type { ScheduleTaskStatus } from '../value-objects/schedule-task-status';
import type { SourceModule } from '../value-objects/source-module';

import type {
  ScheduleExecutionClientDTO,
} from '../entities/schedule-execution-client';

// 从值对象导入类?
import type {
  ScheduleConfigDTO,
  ExecutionInfoDTO,
  RetryPolicyDTO,
  TaskMetadataDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * ScheduleTask Client DTO
 */
export interface ScheduleTaskClientDTO {
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

  // 同步字段
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;

  // ===== 子实?DTO =====
  executions: ScheduleExecutionClientDTO[] | null;
}
