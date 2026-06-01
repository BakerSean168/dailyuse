/**
 * TaskInstance Aggregate Root - Client Interface
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

export interface TaskInstanceClientDTO {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;

  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigDTO;
 
  importance?: ImportanceLevel;
  priority?: number;

  status: TaskInstanceStatus;
  actualStartTime: TransferDate | null;
  actualEndTime: TransferDate | null;

  comment: string | null;

  // 同步字段
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}
