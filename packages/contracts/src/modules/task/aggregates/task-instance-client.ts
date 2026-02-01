/**
 * TaskInstance Aggregate Root - Client Interface
 */

import type {
  TaskInstanceId,
  TaskTemplateId,
  IdentityId,
  DomainDate,
  TransferDate,
} from '@/primitives';
import type { TaskInstanceServerDTO } from './task-instance-server';
import type { TaskInstanceStatus } from '../value-objects/task-instance-status';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  TaskTimeConfig,
  TaskTimeConfigDTO,
  CompletionRecord,
  CompletionRecordDTO,
} from '../value-objects';

export interface TaskInstanceClientDTO {
  id: string;
  templateId: string;
  identityId: string;

  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigDTO;
 
  importance?: ImportanceLevel;
  priority?: number;

  status: TaskInstanceStatus;
  actualStartTime: TransferDate | null;
  actualEndTime: TransferDate | null;

  comment: string | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

export interface TaskInstanceClient {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;

  instanceDate: DomainDate;
  timeConfig: TaskTimeConfig;

  importance?: ImportanceLevel;
  priority?: number;

  status: TaskInstanceStatus;
  actualStartTime: DomainDate | null;
  actualEndTime: DomainDate | null;
  
  comment: string | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}
