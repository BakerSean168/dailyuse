/**
 * TaskInstance Aggregate Root - Server Interface
 * 任务实例聚合根
 *
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 */

import type {
  TaskInstanceId,
  TaskTemplateId,
  IdentityId,
  TransferDate,
} from '../../../primitives';
import type { TaskInstanceStatus } from '../value-objects/task-instance-status';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  TaskTimeConfigDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * TaskInstance Server DTO
 */
export interface TaskInstanceServerDTO {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;

  importance: ImportanceLevel;
  priority?: number;

  status: TaskInstanceStatus;
  actualStartTime: TransferDate | null;
  actualEndTime: TransferDate | null;

  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigDTO;

  comment: string | null;

  // 同步字段
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
